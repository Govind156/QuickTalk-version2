import { axiosInstance } from ".";

export const createNewMessage= async(message)=>{
    try{
        const response =await axiosInstance.post('api/message/new-message',message)
        return response.data
    }
    catch(error){
        return error;
    }

}

export const getAllmesssage=async(chatId)=>{
    try{
      const response=await axiosInstance.get(`api/message/get-all-messages/${chatId}`)
      return response.data
    }
    catch(error){
        return error;
    }
}
export const getScheduledMessages = async (chatId = null) => {
    try {
        const endpoint = chatId 
            ? `api/message/scheduled?chatId=${chatId}`
            : 'api/message/scheduled';
        
        const response = await axiosInstance.get(endpoint);
        const data=Array.isArray(response.data)?response.data :[];
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || error.message,
            data:[]
        };
    }
};

export const cancelScheduledMessage = async (messageId) => {
    try {
        const response = await axiosInstance.delete(`api/message/scheduled/${messageId}`);
        return {
            success: true,
            message: response.message
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.message || error.message
        };
    }
};

export const editScheduledMessage = async (messageId, updates) => {
    try {
        const response = await axiosInstance.put(
            `api/message/scheduled/${messageId}`,
            updates
        );
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
};

// Additional helper function to process scheduled messages
export const processScheduledMessages = async () => {
    try {
        const response = await axiosInstance.get('api/message/process-scheduled');
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || error.message
        };
    }
};
export const  generateAImessage = async (data) => {
    try {
        const response = await axiosInstance.post('api/message/generate-ai-message',data);
        console.log(`response in apicalls/generateAImessage--> ${response}`)
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.message || error.message,
            error: error.response?.data
        };
    }
};

