import { createHmac, randomBytes } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

initializeApp();

const apiKey = defineSecret('IYZICO_API_KEY');
const secretKey = defineSecret('IYZICO_SECRET_KEY');
const appUrl = defineSecret('APP_URL');
// Canlıya geçerken IYZICO_BASE_URL=https://api.iyzipay.com olarak ayarlayın (functions/.env).
const apiBaseUrl = process.env['IYZICO_BASE_URL'] || 'https://sandbox-api.iyzipay.com';
const checkoutInitializePath = '/payment/iyzipos/checkoutform/initialize/auth/ecom';
const checkoutRetrievePath = '/payment/iyzipos/checkoutform/auth/ecom/detail';

const plans = {
  pro: { name: 'Pro Plan', price: '299.00' },
  enterprise: { name: 'Kurumsal Plan', price: '799.00' },
} as const;

type PlanId = keyof typeof plans;

function createAuthorizationHeader(path: string, body: string): string {
  const randomKey = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', secretKey.value())
    .update(randomKey + path + body)
    .digest('hex');
  const authorization = Buffer.from(`${randomKey}:${signature}`).toString('base64');
  return `IYZWSv2 ${authorization}`;
}

async function iyzicoRequest<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const body = JSON.stringify(payload);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: createAuthorizationHeader(path, body),
      'x-iyzi-rnd': randomBytes(16).toString('hex'),
      'Content-Type': 'application/json',
      'x-iyzi-client-version': 'odivon-faturapro/1.0.0',
      'x-iyzi-metadata': Buffer.from(JSON.stringify({ locale: 'tr' })).toString('base64'),
      'x-api-key': apiKey.value(),
    },
    body,
  });

  const result = (await response.json()) as T & { status?: string; errorMessage?: string };
  if (!response.ok || result.status !== 'success') {
    logger.error('iyzico API error', { status: response.status, result });
    throw new Error(result.errorMessage || 'iyzico API request failed');
  }
  return result;
}

async function verifyBearerToken(authorization: string | undefined) {
  if (!authorization?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  return getAuth().verifyIdToken(authorization.slice(7));
}

export const initializeCheckoutForm = onRequest(
  { region: 'europe-west1', secrets: [apiKey, secretKey, appUrl] },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', appUrl.value());
    res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
      return;
    }

    try {
      const user = await verifyBearerToken(req.headers.authorization);
      const planId = req.body?.planId as PlanId;
      if (!(planId in plans)) {
        res.status(400).json({ error: 'INVALID_PLAN' });
        return;
      }

      const plan = plans[planId];
      const conversationId = `odivon-${user.uid}-${Date.now()}`;
      const functionsBaseUrl = process.env['FUNCTIONS_BASE_URL']
        || `https://europe-west1-${process.env['GCLOUD_PROJECT']}.cloudfunctions.net`;
      const callbackUrl = `${functionsBaseUrl}/iyzicoCallback`;
      const displayName = user.name?.trim().split(/\s+/) || ['Odivon', 'Kullanıcısı'];
      const firstName = displayName[0] || 'Odivon';
      const lastName = displayName.slice(1).join(' ') || 'Kullanıcısı';

      const result = await iyzicoRequest<{
        token: string;
        paymentPageUrl: string;
        checkoutFormContent?: string;
      }>(checkoutInitializePath, {
        locale: 'tr',
        conversationId,
        price: plan.price,
        paidPrice: plan.price,
        basketId: conversationId,
        paymentGroup: 'SUBSCRIPTION',
        callbackUrl,
        currency: 'TRY',
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: user.uid,
          name: firstName,
          surname: lastName,
          identityNumber: '11111111111',
          email: user.email || 'test@example.com',
          gsmNumber: user.phone_number || '+905555555555',
          registrationAddress: 'Sandbox adresi',
          city: 'Istanbul',
          country: 'Turkey',
          ip: req.ip || '127.0.0.1',
        },
        shippingAddress: {
          address: 'Sandbox adresi',
          contactName: `${firstName} ${lastName}`,
          city: 'Istanbul',
          country: 'Turkey',
        },
        billingAddress: {
          address: 'Sandbox adresi',
          contactName: `${firstName} ${lastName}`,
          city: 'Istanbul',
          country: 'Turkey',
        },
        basketItems: [{
          id: planId,
          price: plan.price,
          name: plan.name,
          category1: 'SaaS Abonelik',
          itemType: 'VIRTUAL',
        }],
      });

      await getFirestore().collection('paymentAttempts').doc(result.token).set({
        userId: user.uid,
        planId,
        price: plan.price,
        conversationId,
        token: result.token,
        status: 'initialized',
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ paymentPageUrl: result.paymentPageUrl, token: result.token, conversationId });
    } catch (error) {
      logger.error('Checkout initialization failed', error);
      const status = error instanceof Error && error.message === 'UNAUTHENTICATED' ? 401 : 500;
      res.status(status).json({ error: status === 401 ? 'UNAUTHENTICATED' : 'PAYMENT_INITIALIZATION_FAILED' });
    }
  },
);

export const iyzicoCallback = onRequest(
  { region: 'europe-west1', secrets: [apiKey, secretKey, appUrl] },
  async (req, res) => {
    try {
      const token = (req.body?.token || req.query?.token) as string | undefined;
      if (!token) {
        res.status(400).send('Missing token');
        return;
      }

      const attemptRef = getFirestore().collection('paymentAttempts').doc(token);
      const attempt = await attemptRef.get();
      if (!attempt.exists) {
        res.status(404).send('Payment attempt not found');
        return;
      }

      const data = attempt.data()!;
      const result = await iyzicoRequest<{ paymentStatus: string; paymentId?: string; price?: number }>(
        checkoutRetrievePath,
        { locale: 'tr', conversationId: data['conversationId'], token },
      );
      const success = result.paymentStatus === 'SUCCESS' && Number(result.price).toFixed(2) === Number(data['price']).toFixed(2);

      await attemptRef.update({
        status: success ? 'success' : 'failed',
        paymentStatus: result.paymentStatus,
        paymentId: result.paymentId || null,
        completedAt: FieldValue.serverTimestamp(),
      });
      if (success) {
        await getFirestore().collection('users').doc(data['userId']).update({
          plan: data['planId'],
          monthlyInvoiceLimit: 999999,
          customerLimit: 999999,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const redirectUrl = `${appUrl.value()}/pricing?payment=${success ? 'success' : 'failed'}`;
      res.redirect(303, redirectUrl);
    } catch (error) {
      logger.error('iyzico callback failed', error);
      res.status(500).send('Payment verification failed');
    }
  },
);
