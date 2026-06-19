const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

// 🛠️ SRV Network Bypass Connection String
// Note: Agar is string se connect na ho, toh simple apne phone ka Mobile Hotspot connect karke chala lena!
const dbUrl = "mongodb+srv://mongo_db_user:aapka_asli_password@cluster0.bwbqpln.mongodb.net/wanderlust?retryWrites=true&w=majority";

main()
  .then(() => {
    console.log("Connected to MongoDB Cloud Engine!");
    initDB(); 
  })
  .catch((err) => console.log("CONNECTION ERROR:", err));

async function main() {
  await mongoose.connect(dbUrl);
}

const initDB = async () => {
    try {
        await Listing.deleteMany({});
        
        // 🛠️ FIXED: Yahan humne aapke user ki real valid hexagonal ID string setup ki hai
        initData.data = initData.data.map((obj) => ({
            ...obj,
            owner: "6a1976ad6d6f55bd8cb7095d" 
        }));

        await Listing.insertMany(initData.data);
        console.log("🎉 SUCCESS: data was initialized successfully!");
        process.exit(0); 
    } catch (err) {
        console.log("SEEDING ERROR:", err);
        process.exit(1);
    }
};