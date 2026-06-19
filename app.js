// 🛠️ FINAL HYBRID DATA SEEDING ROUTE (Bypasses Schema Enums & Missing Geometry validation)
const Listing = require("./models/listing.js");
const initData = require("./init/data.js");

app.get("/system-db-seed-secure", async (req, res) => {
    try {
        // 1. Purana saara partial data clear karo
        await Listing.deleteMany({});
        
        // 2. Map chalakar pure dynamic array ko sanitize, owner bind aur default geometry inject karo
        initData.data = initData.data.map((obj) => {
            // Mongoose Schema me allowed safe values ki array list
            const allowedEnums = ["Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Camping"];
            
            // Category checking
            let finalCategory = (obj.category && allowedEnums.includes(obj.category)) ? obj.category : "Trending";
            
            return {
                ...obj,
                category: finalCategory,
                owner: "6a1976ad6d6f55bd8cb7095d", // Aapki active user ID mapping
                // 🌟 FIX: Geometry field force insert jo strictly required hai model me
                geometry: obj.geometry || {
                    type: "Point",
                    coordinates: [0, 0] // Default safe point placeholder coordinates
                }
            };
        });
        
        // 3. Pure database array pack ko cloud collection me insert karo
        await Listing.insertMany(initData.data);
        res.send("<h1>🎉 SUCCESS: All 29 Listings Deployed & Injected Successfully!</h1><p>Ab aap /listings check kar sakte hain.</p>");
    } catch(err) {
        res.status(500).send("Seeding Failed: " + err.message);
    }
});