import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const sampleData = [
  { namaBarang: "A+ 10ml", kodeBarang: "A+-10ML", supplier: "S-matamoo", hargaBeli: 17000, stokAwal: 18, stokBarang: 259, terjual: 248, color: "", bc: "", kadarAir: "" },
  { namaBarang: "Alat Pakai Softlens Pink", kodeBarang: "ALATPAKAISOFTLENS-PINK", supplier: "S-jackiesuperstore88", hargaBeli: 8000, stokAwal: 8, stokBarang: 176, terjual: 176, color: "Pink", bc: "", kadarAir: "" },
  { namaBarang: "Alat Pakai Softlens Tosca", kodeBarang: "ALATPAKAISOFTLENS-TOSCA", supplier: "S-jackiesuperstore88", hargaBeli: 9000, stokAwal: 11, stokBarang: 118, terjual: 118, color: "Tosca", bc: "", kadarAir: "" },
  { namaBarang: "Alat Pakai Softlens White", kodeBarang: "ALATPAKAISOFTLENS-White", supplier: "S-jackiesuperstore88", hargaBeli: 9000, stokAwal: 9, stokBarang: 98, terjual: 98, color: "White", bc: "", kadarAir: "" },
  { namaBarang: "Avenue Honey Grey Normal", kodeBarang: "AVENUE-HONEYGREY-0,00", supplier: "S-LINA", hargaBeli: 39000, stokAwal: 4, stokBarang: 6, terjual: 4, color: "Grey", bc: "8.6", kadarAir: "60" },
  { namaBarang: "Macaron Almond Normal", kodeBarang: "CTK-MACARON-ALMONDBROWN-0,00", supplier: "S-KIM", hargaBeli: 26000, stokAwal: 80, stokBarang: 153, terjual: 151, color: "Brown", bc: "8.6", kadarAir: "42" },
  { namaBarang: "Macaron Berry Blue Normal", kodeBarang: "CTK-MACARON-BERRYBLUE-0,00", supplier: "S-KIM", hargaBeli: 26000, stokAwal: 84, stokBarang: 121, terjual: 119, color: "Blue", bc: "8.6", kadarAir: "42" },
  { namaBarang: "Newbluk Black -3,00", kodeBarang: "CTK-NEWBLUK-BLACK-3,00", supplier: "S-KIM", hargaBeli: 26000, stokAwal: 13, stokBarang: 29, terjual: 28, color: "Black", bc: "8.6", kadarAir: "45" },
  { namaBarang: "NMD Caramel Brown Normal", kodeBarang: "CTK-NMD-CARAMELBROWN-0,00", supplier: "S-KIM", hargaBeli: 26000, stokAwal: 2, stokBarang: 18, terjual: 16, color: "Brown", bc: "8.6", kadarAir: "42" },
  { namaBarang: "NMD Galaxy Grey -1,75", kodeBarang: "CTK-NMD-GALAXYGREY-1,75", supplier: "S-KIM", hargaBeli: 26000, stokAwal: 3, stokBarang: 16, terjual: 15, color: "Grey", bc: "8.6", kadarAir: "42" }
];

async function seed() {
  try {
    const batch = writeBatch(db);
    const prodRef = collection(db, 'products');
    
    for (const item of sampleData) {
      const newRef = doc(prodRef);
      batch.set(newRef, {
        ...item,
        hargaJual: item.hargaBeli * 1.5, // 50% markup assumption
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await batch.commit();
    console.log('Seeding complete. Uploaded ' + sampleData.length + ' products.');
  } catch(e) {
    console.log('Error seeding:', e);
  }
}
seed();
