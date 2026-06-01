const Listing = require("./models/listing");
const Review = require("./models/review");

const ExpressError = require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");
const wrapAsync = require("./utils/wrapAsync.js");

module.exports.isLoggedIn = (req,res,next)=>{
if(!req.isAuthenticated()){
    req.session.redirectUrl = req.originalUrl;
        req.flash("error","you must be logged in to create listing!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session && req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }else{
        res.locals.redirectUrl ="/listings";
    }
    next();
};

// module.exports.isOwner =async(req,res,next)=>{
//     let { id } = req.params;
//     let listing = await Listing.findById(id);
//     if(!currUser && listing.owner._id.equals(res.locals.currUser._id)){
//     req.flash("error","You are not the owner of this listing");
//     return res.redirect(`/listings/${id}`);

//     }
//     next();
// };
module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    // Agar user logged in nahi hai ya owner nahi hai, tabhi error dikhayein
    if (!res.locals.currUser || !listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of this listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
};
module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params; // URL se listing id aur review id dono le rahe hain
    
    // Review find karo
    let review = await Review.findById(reviewId);
    
    // Check karo ki kya current user ne hi ye review likha hai
    if (!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review");
        return res.redirect(`/listings/${id}`);
    }
    
    next();
};