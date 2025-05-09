import {useSelector} from 'react-redux'
import { createNewChat } from '../../../apiCalls/chat'
import { hideLoader, showLoader } from '../../../redux/loaderSlice'
import { setAllChats ,setAllUser,setSelectedChat} from '../../../redux/usersSlice'
import {toast} from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import moment from 'moment'
import store from '../../../redux/store'
import { useEffect,useState } from 'react'

function Searchlist({searchkey,setSearchKey,socket}){
 const {user:currentuser,Alluser,Allchats}=useSelector(state=>state.userReducer)  
 const dispatch=useDispatch()
 const {selectedchat}=useSelector(state=>state.userReducer)
 const [onlineUsers, setOnlineUsers] = useState([]);

 useEffect(() => {
    if (socket) {
      // Listen for online users updates
      socket.on('online-users-updated', (users) => {
        setOnlineUsers(users || []);
      });

      // Request current online users
    //   socket.emit('get-online-users');
    }

    return () => {
      if (socket) {
        socket.off('online-users-updated');
      }
    };
  }, [socket]); 
 const startNewChat=async(searchuserid)=>{
    if (!currentuser?._id) return;
    
    // First check if chat already exists
    const existingChat = Allchats.find(chat => 
        chat.members.some(m => m._id === currentuser._id) && 
        chat.members.some(m => m._id === searchuserid)
    );

    if (existingChat) {
        // Chat already exists, just select it
        dispatch(setSelectedChat(existingChat));
        return;
    }

    if (!currentuser?._id) return;
    let response=null
    try{
        dispatch(showLoader())
        response=await createNewChat([currentuser?._id,searchuserid])
        dispatch(hideLoader())
        if(response.success){
            toast.success(response.message)
            const newchat=response.data
            const updatedchat=[...Allchats,newchat]
            dispatch(setAllChats(updatedchat))
            dispatch(setSelectedChat(newchat))
        }
    }
    catch(error){
        toast.error( 'Failed to create chat')
        dispatch(hideLoader())

    }
 }

 const openchat=(selecteduserid)=>{
    if (!currentuser?._id || !selecteduserid) return;

    const chat=Allchats.find((eachchat)=>
                        (eachchat?.members?.map(m=>m?._id).includes(currentuser?._id) && 
                        eachchat?.members?.map(m=>m?._id).includes(selecteduserid)))
    if(chat){
        dispatch(setSelectedChat(chat))
    }
 }

 const Isselectedchat=(user)=>{
    if (!user?._id || !selectedchat?.members) return false;
    return selectedchat.members.some(m => m?._id === user._id);
    // if(selectedchat && user._id){
    //    return selectedchat?.members?.map(m=>m?._id).includes(user._id);
    // }
    //  return false;
 }

 const getlastMessage=(userId)=>{
    const chat=Allchats.find((eachchat)=>eachchat?.members?.map(m=>m?._id).includes(userId))
    if(!chat || !chat.lastMessage || !currentuser?._id){
        return "";
    }
    else{
       const msgprefix=chat?.lastMessage?.sender === currentuser?._id ? "You : " : "" 
    //    return msgprefix+chat?.lastMessage?.text.substring(0,25)
       return msgprefix + (chat?.lastMessage?.text ? chat.lastMessage.text.substring(0,25) : "")
    }

 }

 const getlastMessageTimeStamp=(userId)=>{
    const chat=Allchats.find((eachchat)=>eachchat?.members?.map(m=>m?._id).includes(userId))
    if(!chat || !chat?.lastMessage){
        return ""
    }
    else{
        return moment(chat?.lastMessage?.createdAt).format('hh:mm A')
    }
 }

 function formatName(user){
    let fname=user?.firstName?.charAt(0)?.toUpperCase()+user?.firstName.slice(1)?.toLowerCase() || ""
    let lname=user?.LastName?.charAt(0)?.toUpperCase()+user?.LastName.slice(1)?.toLowerCase() || ""
    return `${fname} ${lname}`.trim()
 }
 
 const getunreadMessageCount=(userId)=>{
    const chat=Allchats.find((eachchat)=>eachchat?.members?.map(m=>m?._id).includes(userId))
    
    if(chat && chat.unreadMessageCount &&  chat.lastMessage?.sender !==currentuser?._id){
        return <div className='unread-message-counter'>{chat.unreadMessageCount}</div>
    }else{
        return ""
    }
 }

 function getdata(){
    if(searchkey === ""){
        return Allchats;
    }else{
        return Alluser.filter((eachuser)=>{
            let matchUser=eachuser?.firstName?.toLowerCase().includes(searchkey.toLowerCase()) ||
            eachuser?.LastName?.toLowerCase().includes(searchkey.toLowerCase())

            return( (!eachuser?.deleted )  && matchUser )
        })
    }
 }
// function getdata() {
//     if(searchkey === "") {
//         return Allchats.filter(chat => {
//             // Filter out chats with deleted users
//             return chat.members.every(member => !member?.deleted);
//         });
//     } else {
//         return Alluser.filter((eachuser) => {
//             // Exclude deleted users from search
//             return !eachuser?.deleted && (
//                 eachuser?.firstName?.toLowerCase().includes(searchkey.toLowerCase()) ||
//                 eachuser?.LastName?.toLowerCase().includes(searchkey.toLowerCase())
//             );
//         });
//     }
// }

 useEffect(()=>{
    if (!socket) return;
    socket.off('set-message-count').on('set-message-count',(message)=>{
        let selectedchat=store.getState().userReducer.selectedchat
        let Allchats=store.getState().userReducer.Allchats;
        if(selectedchat?._id !== message?.chatId){
            const updatedchats=Allchats.map((eachchat)=>{
                if(eachchat?._id === message?.chatId){
                    return{
                        ...eachchat,
                        unreadMessageCount:(eachchat?.unreadMessageCount || 0) +1,
                        lastMessage:message
                    }
                }
                return eachchat
            })
            Allchats=updatedchats
        }
        

        //find the latest chat
        const lastestchat=Allchats.find(eachchat=>eachchat?._id === message?.chatId)
        //get other chat
        const otherchats=Allchats.filter(eachchat=>eachchat?._id !== message?.chatId)
        
        //create a new arr in which lastest chat on top
        Allchats=[lastestchat,...otherchats]
        dispatch(setAllChats(Allchats))
    })
 },[])
 useEffect(() => {
    if (!socket) return;
    socket.off('profile-pic-updated').on('profile-pic-updated', (data) => {
        const { userId, profilePic } = data;
        
        // Update Alluser array
        const updatedAllUser = Alluser.map(user => 
            user?._id === userId ? {...user, ProfilePic: profilePic} : user
        );
        
        // Update Allchats array (to update profile pics in chat members)
        const updatedAllChats = Allchats.map(chat => {
            const updatedMembers = chat.members.map(member => 
                member?._id === userId ? {...member, ProfilePic: profilePic} : member
            );
            return {...chat, members: updatedMembers};
        });
        dispatch(setAllUser(updatedAllUser))
        dispatch(setAllChats(updatedAllChats));
        // If you have a separate state for Alluser, dispatch an update here
    });

    return () => {
        socket.off('profile-pic-updated');
    };
}, [Alluser, Allchats, dispatch]);

 return(
    <div className='search-list-container'>
      {getdata()
    .filter(obj => obj !== null && obj !== undefined)
    .map((obj)=>{
        let eachuser=obj
        if(obj?.members){
            eachuser=obj.members?.find(mem => mem?._id !== currentuser?._id)
        }
        if (!eachuser || !eachuser._id) return null; // Skip if user not found
        return(
        <div
        onClick={()=>openchat(eachuser?._id)} 
        className="user-search-filter"
         key={eachuser._id}
        >
            <div className={Isselectedchat(eachuser) ? "selected-user" : "filtered-user"}>
                <div className="filter-user-display">
                    {!eachuser.deleted && 
                    eachuser.ProfilePic &&  
                    <img src={eachuser.ProfilePic} 
                    alt="Profile Pic" 
                    className="user-profile-image"
                    style={onlineUsers.includes(eachuser._id)?{border:'#82e0aa 4px solid'}:{}}
                    />
                    }
                    {(!eachuser.deleted && !eachuser.ProfilePic) && 
                    <div className={Isselectedchat(eachuser)?"user-selected-avatar":"user-default-avatar"}
                    style={onlineUsers.includes(eachuser._id)?{border:'#82e0aa 4px solid'}:{}}
                    >
                        {eachuser.firstName[0].toUpperCase()+eachuser.LastName[0].toUpperCase()}
                    </div>
                    }
                    {eachuser.deleted  && 
                    <div className="user-default-avatar">
                      DU
                    </div>
                    }
                    <div className="filter-user-details">
                        <div className="user-display-name">
                            {eachuser.deleted ? "Deleted User" :formatName(eachuser)}
                        </div>
                        <div className="user-display-email">
                            {getlastMessage(eachuser._id) || 
                            (eachuser.deleted ? "deleted-1746469935189@example.com" : eachuser.email)
                            }
                        </div>
                    </div>
                        <div>
                            {getunreadMessageCount(eachuser?._id)}
                            <div className='last-message-timestamp'>
                                {getlastMessageTimeStamp(eachuser?._id)}
                            </div>
                        </div>
                        
                        {
                            !Allchats.some((eachchat)=>eachchat?.members?.map(m=>m._id).includes(eachuser._id)) &&
                            <div className="user-start-chat">
                            <button
                            onClick={(e)=>{
                                e.stopPropagation()
                                startNewChat(eachuser._id)
                            }}
                            className="user-start-chat-btn">Invite</button>
                            </div>
                        }
                </div>
            </div>                            
        </div>)
    })
    }
    </div>
 ) 
}
export default Searchlist
