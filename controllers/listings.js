const Listing = require("../models/listing");
// MapTiler client import
const maptilerClient = require('@maptiler/client');
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");
        
    if (!listing) {
        req.flash("error", "Requested Listing doesn't exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    // 1. MapTiler API ko call karke Location (text) ko Coordinates mein badalna
    const geoData = await maptilerClient.geocoding.forward(req.body.listing.location, { limit: 1 });

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // 2. Agar API ne coordinates diye hain, toh use 'geometry' mein save karein
    if (geoData.features.length > 0) {
        newListing.geometry = geoData.features[0].geometry;
    } else {
        // Agar location invalid ho toh default point de dein
        newListing.geometry = { type: 'Point', coordinates: [0, 0] }; 
    }

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Requested Listing doesn't exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    // Agar nayi image upload hui hai
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    
    // (Optional) Agar location bhi update karni ho toh yahan dobara geocoding call kar sakte hain

    req.flash("success", "Listing Updated!");
    return res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing deleted!");

    res.redirect("/listings");
};


// const Listing = require("../models/listing");

// module.exports.index = async (req, res) => {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", { allListings });
// };

// module.exports.renderNewForm = (req,res)=>{
//     res.render("listings/new.ejs");
// };

// module.exports.showListing = async (req, res) => {
//     let { id } = req.params;

//     const listing = await Listing.findById(req.params.id)
//     .populate({
//         path:"reviews",
//         populate:{
//           path:"author", 
//        },
//      })
//     .populate("owner");
//     if(!listing){
//     req.flash("error","Requested Listing doesn't exist!");
//     return res.redirect("/listings");
//     }
//     console.log(listing);
//     res.render("listings/show.ejs", { listing });
// };

// module.exports.createListing = async (req, res, next) => {
//     let url = req.file.path;
//     let filename = req.file.filename;

//     const newListing = new Listing(req.body.listing);
//     newListing.owner = req.user._id;
//     newListing.image={url,filename};
//     await newListing.save();
//     req.flash("success","New Listing Created!");
//     res.redirect("/listings");
// };

// module.exports.renderEditForm = async (req, res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id);
//     if(!listing){
//     req.flash("error","Requested Listing doesn't exist!");
//     return res.redirect("/listings");
//     }
//    let originalImageUrl = listing.image.url;
//    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
//    res.render("listings/edit.ejs", { listing ,originalImageUrl});
// };



// module.exports.updateListing = async (req, res) => {
//     let { id } = req.params;
//     let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
//     if(typeof req.file!=="undefined"){
//     let url = req.file.path;
//     let filename = req.file.filename;
//     listing.image={url,filename};
//     await listing.save();
//     }
//     req.flash("success","Listing  Updated!");
//     return res.redirect(`/listings/${id}`);
// };

// module.exports.destroyListing = async (req, res) => {
//     let { id } = req.params;
//     let deletedListing = await Listing.findByIdAndDelete(id);
//     console.log(deletedListing);
//     req.flash("success","Listing deleted!");

//     res.redirect("/listings");
// };