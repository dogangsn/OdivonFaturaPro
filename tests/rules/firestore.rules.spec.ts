import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, setLogLevel } from 'firebase/firestore';

// Gelir akışının dayandığı Firestore kuralları.
// `gap(...)` ile işaretli testler bugün bilinen bir açığı belgeler: kural düzeltildiğinde
// test "beklenmedik şekilde geçti" diye kırmızıya döner, o zaman `gap` yerine `it` yazın.
const gap = it.fails;

let env: RulesTestEnvironment;

const ALICE = 'alice';
const BOB = 'bob';

function freeProfile(uid: string) {
  return {
    uid,
    email: `${uid}@example.com`,
    displayName: uid,
    plan: 'free',
    monthlyInvoiceLimit: 5,
    customerLimit: 5,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function invoice(userId: string, extra: Record<string, unknown> = {}) {
  return {
    userId,
    invoiceNo: 'INV-2026-0001',
    customerName: 'Müşteri A.Ş.',
    items: [{ description: 'Hizmet', quantity: 1, unitPrice: 100, taxRate: 20 }],
    subtotal: 100,
    taxTotal: 20,
    total: 120,
    status: 'draft',
    ...extra,
  };
}

beforeAll(async () => {
  setLogLevel('silent');
  env = await initializeTestEnvironment({
    projectId: 'demo-odivon-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', ALICE), freeProfile(ALICE));
    await setDoc(doc(db, 'users', BOB), freeProfile(BOB));
    await setDoc(doc(db, 'invoices', 'bob-inv'), invoice(BOB));
  });
});

const asAlice = () => env.authenticatedContext(ALICE).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe('users/{uid} — profil ve plan', () => {
  it('kullanıcı kendi profilini okuyabilir', async () => {
    await assertSucceeds(getDoc(doc(asAlice(), 'users', ALICE)));
  });

  it('kullanıcı başkasının profilini okuyamaz', async () => {
    await assertFails(getDoc(doc(asAlice(), 'users', BOB)));
  });

  it('girişsiz kullanıcı profil okuyamaz', async () => {
    await assertFails(getDoc(doc(anon(), 'users', ALICE)));
  });

  it('kullanıcı firma bilgilerini güncelleyebilir', async () => {
    await assertSucceeds(
      updateDoc(doc(asAlice(), 'users', ALICE), { companyName: 'Alice Ltd', updatedAt: serverTimestamp() }),
    );
  });

  it('yeni kullanıcı ücretsiz planla kayıt olabilir', async () => {
    const db = env.authenticatedContext('carol').firestore();
    await assertSucceeds(setDoc(doc(db, 'users', 'carol'), freeProfile('carol')));
  });

  gap('kullanıcı ödeme yapmadan kendi planını pro yapamamalı', async () => {
    await assertFails(updateDoc(doc(asAlice(), 'users', ALICE), { plan: 'pro' }));
  });

  gap('kullanıcı kendi fatura limitini yükseltememeli', async () => {
    await assertFails(updateDoc(doc(asAlice(), 'users', ALICE), { monthlyInvoiceLimit: 999999 }));
  });

  gap('kullanıcı kendi müşteri limitini yükseltememeli', async () => {
    await assertFails(updateDoc(doc(asAlice(), 'users', ALICE), { customerLimit: 999999 }));
  });

  gap('yeni kullanıcı doğrudan pro planla kayıt olamamalı', async () => {
    const db = env.authenticatedContext('dave').firestore();
    await assertFails(setDoc(doc(db, 'users', 'dave'), { ...freeProfile('dave'), plan: 'enterprise' }));
  });

  gap('kullanıcı profilini silip ücretsiz kotayı sıfırlayamamalı', async () => {
    await assertFails(deleteDoc(doc(asAlice(), 'users', ALICE)));
  });
});

describe('invoices — fatura verisi', () => {
  it('kullanıcı kendi adına fatura oluşturabilir', async () => {
    await assertSucceeds(setDoc(doc(asAlice(), 'invoices', 'a1'), invoice(ALICE)));
  });

  it('kullanıcı başkası adına fatura oluşturamaz', async () => {
    await assertFails(setDoc(doc(asAlice(), 'invoices', 'a2'), invoice(BOB)));
  });

  it('kullanıcı başkasının faturasını okuyamaz', async () => {
    await assertFails(getDoc(doc(asAlice(), 'invoices', 'bob-inv')));
  });

  it('kullanıcı başkasının faturasını silemez', async () => {
    await assertFails(deleteDoc(doc(asAlice(), 'invoices', 'bob-inv')));
  });

  it('kullanıcı faturasının sahibini değiştiremez', async () => {
    await setDoc(doc(asAlice(), 'invoices', 'a3'), invoice(ALICE));
    await assertFails(updateDoc(doc(asAlice(), 'invoices', 'a3'), { userId: BOB }));
  });

  it('girişsiz kullanıcı fatura oluşturamaz', async () => {
    await assertFails(setDoc(doc(anon(), 'invoices', 'x'), invoice(ALICE)));
  });

  gap('ücretsiz plandaki kullanıcı limit dolunca yeni fatura oluşturamamalı', async () => {
    const db = asAlice();
    for (let i = 0; i < 5; i++) {
      await setDoc(doc(db, 'invoices', `free-${i}`), invoice(ALICE));
    }
    await assertFails(setDoc(doc(db, 'invoices', 'free-6'), invoice(ALICE)));
  });
});

describe('customers ve expenses', () => {
  it('kullanıcı kendi müşterisini ekleyebilir', async () => {
    await assertSucceeds(setDoc(doc(asAlice(), 'customers', 'c1'), { userId: ALICE, name: 'X' }));
  });

  it('kullanıcı başkası adına müşteri ekleyemez', async () => {
    await assertFails(setDoc(doc(asAlice(), 'customers', 'c2'), { userId: BOB, name: 'X' }));
  });

  gap('ücretsiz plandaki kullanıcı 5 müşteriden fazlasını ekleyememeli', async () => {
    const db = asAlice();
    for (let i = 0; i < 5; i++) {
      await setDoc(doc(db, 'customers', `c-${i}`), { userId: ALICE, name: `C${i}` });
    }
    await assertFails(setDoc(doc(db, 'customers', 'c-6'), { userId: ALICE, name: 'C6' }));
  });

  it('kullanıcı başkası adına gider ekleyemez', async () => {
    await assertFails(setDoc(doc(asAlice(), 'expenses', 'e1'), { userId: BOB, amount: 10 }));
  });

  it('tanımsız koleksiyonlar kapalı', async () => {
    await assertFails(setDoc(doc(asAlice(), 'payments', 'p1'), { userId: ALICE }));
  });
});
