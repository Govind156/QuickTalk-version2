import { useSelector,useDispatch } from "react-redux";
import Chatarea from "./components/Chatarea";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import {io} from 'socket.io-client' 
import { useEffect, useState } from "react";
import { setAddNewUser } from "../../redux/usersSlice";

//this makes sure that our client app is connected to server app
const socket=io('https://quicktalk-version2-server.onrender.com')

function Home(){
    const {selectedchat,user}=useSelector(state=>state.userReducer)
    const dispatch=useDispatch()
    //  const [onlineUser,setOnlineUsers]=useState([])    
    
    useEffect(() => {
        if (user) {
            socket.emit('join-room', user._id);
            socket.emit('user-login', user._id);

            // Add listener for new users
            socket.on('new-user-added', (newUser) => {
                dispatch(setAddNewUser(newUser));
            });

    
            // const updateOnlineUsers = (onlineUsers) => {
            //     setOnlineUsers(onlineUsers);
            // };
    
            // socket.on('online-users', updateOnlineUsers);
            // socket.on('online-users-updated', updateOnlineUsers);
    
            // 🔴 Important cleanup to avoid memory leaks
            // return () => {
            //     socket.off('online-users', updateOnlineUsers);
            //     // socket.off('online-users-updated', updateOnlineUsers);
            // };
            //[user,onlineUser]
        }

        return ()=>{
            if(socket){
                socket.off('new-user-added')
            }
        }
    }, [user,dispatch]); // ✅ only depends on user
    

    return (
        <div className="home-page">
        <Header socket={socket}/>
            <div className="main-content">
                {/* <Sidebar socket={socket} onlineUser={onlineUser}></Sidebar> */}
                <Sidebar socket={socket} ></Sidebar>
                {selectedchat && <Chatarea socket={socket}></Chatarea>}
            </div>
        </div>
    )
}
export default Home;