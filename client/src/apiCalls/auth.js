import axios from "axios";
import { axiosInstance,url } from "./index";

export const signupUser=async(user)=>{
    try{
        const response =await axiosInstance.post(url+'api/auth/signup',user)
        return response.data
    }catch(error){
        return error;
    }
}
export const verifysignup=async(verificationcode)=>{
    try{
        const response =await axiosInstance.post(url+'api/auth/verifysignup',verificationcode)
        return response.data
    }
    catch(error){
        return error;

    }
}

export const logInUser=async(user)=>{
    try{
        const response=await axiosInstance.post(url+'api/auth/login',user)
        return response.data
    }
    catch(error){
        return error;
    }
}
export const Resendverifycode=async(email)=>{
    try{
        const response =await axiosInstance.post(url+'api/auth/resend-verification',email)
        return response.data
    }
    catch(error){
        return error;

    }
}