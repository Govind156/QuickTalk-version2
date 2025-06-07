import axios from 'axios'
export const url="https://quicktalk-version2-server.onrender.com/"
export const axiosInstance=axios.create({
    headers:{
        authorization:`Bearer ${localStorage.getItem('token')}`
    }
})
