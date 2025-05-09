import {useEffect, useState} from 'react'
import {resolvePath, useNavigate} from 'react-router-dom'
import { getloggedUser ,getAllUser} from '../apiCalls/user'
import {useDispatch, useSelector} from 'react-redux'
import { hideLoader, showLoader } from '../redux/loaderSlice'
import {setUser,setAllUser, setAllChats} from '../redux/usersSlice'
import {toast} from 'react-hot-toast'
import { getAllchats } from '../apiCalls/chat'
function ProtectedRoute({children}){
  // const [user,setUser]=useState(null)
  const {user}=useSelector(state=>state.userReducer)
  const dispatch=useDispatch()
  const navigate=useNavigate()

 const getloggedInUser=async ()=>{
  let response=null
  try{
    dispatch(showLoader())
    const response=await getloggedUser()
    dispatch(hideLoader())
    if(response.success)
       dispatch(setUser(response.data))
    else{
     toast.error(response.message)
     navigate('/login')
    }
  }
  catch(error){
    navigate('/login')
  }
 }
 const getAllUsersfromdb=async ()=>{
  let response=null
  try{
    dispatch(showLoader())
    const response=await getAllUser()
    dispatch(hideLoader())
    if(response.success)
       dispatch(setAllUser(response.data))
    else{
     toast.error(response.message)
     navigate('/login')
    }
  }
  catch(error){
    navigate('/login')
  }
 }
 const getCurrentUserChats=async()=>{
  let response=null;
  
  try{
    response=await getAllchats()
    if(response.success){
       dispatch(setAllChats(response.data))
    }
  }
  catch(error){
    toast.error(response.message)
    navigate('/login')
  }
 }

 useEffect(()=>{
    if(localStorage.getItem('token')){
        getloggedInUser();
        getAllUsersfromdb();
        getCurrentUserChats();
    }
    else{
        navigate('/login')
    }
 },[])
  return(
    <div>
        {/* <p>Name:{user?.firstName+' '+user?.LastName}</p>
        <br></br>
        <p>Email:{user?.email}</p>
        <br></br> */}
        {children}
    </div>
  )
}
export default ProtectedRoute