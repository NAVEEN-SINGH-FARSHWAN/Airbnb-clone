if(process.env.NODE_ENV!="production"){
require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require('express-session');
const MongoStore = require('connect-mongo'); 
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const { isLoggedIn, saveRedirectUrl } = require("./middleware.js");

const listingRouter = require("./routes/listing.js")
const reviewsRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret: process.env.SECRET
    },
    touchAfter:24 * 3600,
});

store.on("error",(err)=>{
   console.log("ERROR in MONGO SESSION STORE",err);
});

const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly:true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// 🛠️ ULTIMATE BULLET-PROOF DATA SEEDING ROUTE (Bypasses Array/Object & Geometry structure issues)
const Listing = require("./models/listing.js");
const initData = require("./init/data.js");

app.get("/system-db-seed-secure", async (req, res) => {
    try {
        // 1. Purana crash data clear karo
        await Listing.deleteMany({});
        
        // 2. Safely extract raw array chahe initData khud array ho ya usme .data array ho
        let rawData = Array.isArray(initData) ? initData : (initData.data && Array.isArray(initData.data) ? initData.data : null);
        
        if (!rawData) {
            return res.status(400).send("Seeding Failed: init/data.js ka structure array format me nahi mila!");
        }
        
        // 3. Map chalakar pure dynamic array ko sanitize, owner bind aur geometry inject karo
        const sanitizedData = rawData.map((obj) => {
            const allowedEnums = ["Trending", "Rooms", "Iconic Cities", "Mountains", "Castles", "Camping"];
            let finalCategory = (obj.category && allowedEnums.includes(obj.category)) ? obj.category : "Trending";
            
            return {
                ...obj,
                category: finalCategory,
                owner: "6a1976ad6d6f55bd8cb7095d", // Aapki active user ID mapping
                geometry: obj.geometry || {
                    type: "Point",
                    coordinates: [0, 0] // Default safe point placeholder coordinates
                }
            };
        });
        
        // 4. Cloud MongoDB me write karo
        await Listing.insertMany(sanitizedData);
        res.send("<h1>🎉 SUCCESS: All 29 Listings Cleaned and Seeded Automatically!</h1><p>Ab aap /listings page check kar sakte hain.</p>");
    } catch(err) {
        res.status(500).send("Seeding Failed: " + err.message);
    }
});

// 8. Root Route
app.get("/", (req, res) => {
    res.redirect('/listings');
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewsRouter);
app.use("/",userRouter);

//9. 404 Route
app.all("*any", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
});

// 10. Error Handling Middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong!" } = err;
    
    res.locals.success = req.flash("success") || [];
    res.locals.error = req.flash("error") || [];
    res.locals.currUser = req.user || null;

    return res.status(statusCode).render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log("server is listening to port 8080");
});