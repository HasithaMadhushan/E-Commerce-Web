import UserModel from "../models/userModel.js";



//add product to user cart
const addToCart=async (req,res)=>{
 try {

const {userId,itemId,size} = req.body;

if (!userId || !itemId || !size) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
}

const userData =await UserModel.findById(userId);
if (!userData) {
    return res.status(404).json({ success: false, message: "User not found" });
}

let cartData=await userData.cartData;

if (cartData[itemId]){
    if(cartData[itemId][size]){
        cartData[itemId][size] += 1; // Increment quantity if item already exists
    }else{
        cartData[itemId][size] = 1;
    }

}else{
    cartData[itemId] = {}
    cartData[itemId][size] = 1;
}
await UserModel.findByIdAndUpdate(userId, { cartData: cartData });
res.status(200).json({ success: true,message: "Item added to cart successfully" });

 } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add item to cart", error: error.message });
 }



}

//update user cart
const updateCart=async (req,res)=>{
try {
    const {userId,itemId,size,quantity} = req.body;

    if (!userId || !itemId || !size || quantity === undefined) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const userData =await UserModel.findById(userId);
    if (!userData) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    let cartData=await userData.cartData;

    if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        if (cartData[itemId] && cartData[itemId][size]) {
            delete cartData[itemId][size];
            if (Object.keys(cartData[itemId]).length === 0) {
                delete cartData[itemId];
            }
        }
    } else {
        if (!cartData[itemId]) {
            cartData[itemId] = {};
        }
        cartData[itemId][size] = quantity; // Update the quantity of the item
    }
    
    await UserModel.findByIdAndUpdate(userId,{cartData});
    res.status(200).json({ success: true, message: "Cart updated successfully" });

} catch (error) {
    res.status(500).json({ success: false, message: "Failed to update cart", error: error.message });
}
}




//get user cart data
const getUserCart=async (req,res)=>{

    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const userData = await UserModel.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        let cartData =  await userData.cartData;
        res.status(200).json({ success: true, cartData });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to get cart data", error: error.message });
    }




}




export {addToCart,updateCart,getUserCart}
