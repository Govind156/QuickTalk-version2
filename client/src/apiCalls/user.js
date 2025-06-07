import axios from "axios";
import { axiosInstance ,url} from "./index"; 
import { useTheme } from "@chakra-ui/react";
export const getloggedUser=async ()=>{
    try{
        const response=await axiosInstance.get(url+'api/user/get-logged-user')
        return response.data
    }
    catch(error){
        return error;
    }
}
export const getAllUser=async ()=>{
    try{
        const response=await axiosInstance.get(url+'api/user/get-all-users')
        return response.data
    }
    catch(error){
        return error;
    }
}
export const uploadProfilePic=async(image)=>{
    try{
        const response=await axiosInstance.post(url+'api/user/upload-profile-pic',{image})
        return response.data
    }
    catch(error){
        return error;
    }
}
export const updateUserThemePreference = async (userId, theme) => {
    try {
        const response = await axiosInstance.put(url+'api/user/theme',{userId,theme})
        return response.data
        return data;
    } catch (error) {
        throw error;
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await axiosInstance.delete(url+`api/user/delete-user/${userId}`);
        return response.data;
    } catch (error) {
        return error;
    }
};