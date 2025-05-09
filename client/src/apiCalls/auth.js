import axios from "axios";
import { axiosInstance } from "./index";

export const signupUser=async(user)=>{
    try{
        const response =await axiosInstance.post('/api/auth/signup',user)
        return response.data
    }catch(error){
        return error;
    }
}
export const verifysignup=async(verificationcode)=>{
    try{
        const response =await axiosInstance.post('/api/auth/verifysignup',verificationcode)
        return response.data
    }
    catch(error){
        return error;

    }
}

export const logInUser=async(user)=>{
    try{
        const response=await axiosInstance.post('/api/auth/login',user)
        return response.data
    }
    catch(error){
        return error;
    }
}