import {v2 as cloudinary} from "cloudinary";
import fs  from "fs";




    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
   const uploadONCloudinary= async (localFilePath)=>{
       try {
            if(!localFilePath) return null;
            // Upload file to cloudinary
            const response= await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto",
                folder: "Chai_or_app",
            });

            // file has been uploaded successfully
            console.log("file is uploaded on cloudinary", response.url);
            return response;
       }catch (error) {
            fs.unlinkSync(localFilePath) // remoe the locally saved temporary file as the upload 
       }    



       }



    // Upload an image
       cloudinary.uploader
       .upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
   export {uploadONCloudinary}