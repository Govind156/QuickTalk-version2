import { useState ,useEffect,useCallback,useRef} from "react";
import { useSelector ,useDispatch} from "react-redux";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { createNewMessage,getAllmesssage,getScheduledMessages,cancelScheduledMessage,editScheduledMessage} from "../../../apiCalls/message";
import {clearUnreadMessageCount} from "../../../apiCalls/chat"
import {toast} from 'react-hot-toast'
import moment from 'moment'
import store from './../../../redux/store'
import { setAllChats,addScheduledMessage,
  removeScheduledMessage,updateScheduledMessage,
  setScheduledMessages,setMarkUserAsDeleted ,
  clearAIResponse,setCurrentChatUser,
  updateCurrentChatUser,saveChatDraft,clearChatDraft} from "../../../redux/usersSlice";
import EmojiPicker from 'emoji-picker-react'
import { ArrowBackIcon, CalendarIcon ,TimeIcon} from '@chakra-ui/icons';
import ScheduleMessageModal from './ScheduleMessageModal'
import ScheduledMessagesList from './ScheduledMessagesList';
import { useDisclosure } from '@chakra-ui/react';
import AIMessageModal from './AIMessageModal'
import { Tooltip } from '@chakra-ui/react'

function Chatarea({socket}){
    const {currentChatUser,selectedchat,user,Allchats,scheduledMessages,chatDrafts}=useSelector(state=>state.userReducer)
    // const selecteduser=selectedchat?.members?.find(u=>u?._id !== user._id)
    const selecteduser = selectedchat?.members?.find(u => {
      if (!u || !user) return false;
      return u._id !== user._id;
    }); 
    const [message,setMessage]=useState('')
    const [allMessages,setAllMessages]=useState([])
    const dispatch=useDispatch()
    const [isTyping, setisTyping]=useState(false)
    const [data,setdata]=useState(false)
    const [showEmojiPicker,setShowEmojiPicker]=useState(false)
    const [showScheduledList, setShowScheduledList] = useState(false);
    
    // Add this ref for debouncing
    const typingTimeoutRef = useRef(null);

     // Modal controls
    const { 
      isOpen: isScheduleModalOpen, 
      onOpen: onScheduleModalOpen, 
      onClose: onScheduleModalClose
     } = useDisclosure();
    const { 
      isOpen: isAIModalOpen, 
      onOpen: onAIModalOpen, 
      onClose: onAIModalClose 
    } = useDisclosure();
    // const [currentChatUser, setCurrentChatUser] = useState(selecteduser);  
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
   
   
  
   


    const sendMessage = async (image, scheduledFor = null) => {
      if (currentChatUser?.deleted) {
        toast.error('Cannot send messages to deleted accounts');
        return;
      }
      try {
        const NewMessage = {
          chatId: selectedchat._id,
          sender: user._id,
          text: message,
          image: image,
        };
        //use when handle schedule message from client side
        // if (scheduledFor) {
        //   NewMessage.scheduledFor = scheduledFor;
        //   NewMessage.scheduled = true;
        //   NewMessage.sent = false;
    
        //   // Create temporary message for optimistic UI
        //   const tempMessage = {
        //     ...NewMessage,
        //     _id: `temp-${Date.now()}`,
        //     createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
        //   };
          
        //   dispatch(addScheduledMessage(tempMessage));
          
        //   try {
        //     const response = await createNewMessage(NewMessage);
        //     if (response.success) {
        //       // Replace temp message with real one
        //       dispatch(removeScheduledMessage(tempMessage._id));
        //       dispatch(addScheduledMessage(response.data));
        //     }
        //   } catch (error) {
        //     // Remove temp message if API call fails
        //     dispatch(removeScheduledMessage(tempMessage._id));
        //     throw error;
        //   }
        // }
        if (scheduledFor) {
          NewMessage.scheduledFor = scheduledFor;
          NewMessage.scheduled = true;
          NewMessage.sent = false;
    
          const response = await createNewMessage(NewMessage);
          if (response.success) {
            dispatch(addScheduledMessage(response.data));
          }
         }
        else {
          // Regular message handling
            socket.emit('send-message', {
              ...NewMessage,
              members: selectedchat.members.map(m => m._id),
              read: false,
              createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
            });
            await createNewMessage(NewMessage);
        }
       
        // Clear the draft after sending
        dispatch(clearChatDraft({ chatId: selectedchat._id }));
        setMessage('');
        setShowEmojiPicker(false);
      } catch (error) {
        toast.error(error.message);
      }
    };
    //used these function when handle schedule message logic  from client side 
    // const checkAndSendScheduledMessages = useCallback(async () => {
    //   try {
    //     const state = store.getState().userReducer;
    //     const now = new Date();
        
    //     const messagesToSend = state.scheduledMessages.filter(msg => 
    //       msg?.chatId === state.selectedchat?._id &&
    //       msg?.scheduledFor &&
    //       new Date(msg.scheduledFor) <= now &&
    //       msg.scheduled === true &&
    //       msg.sent === false
    //     );
    
    //     for (const msg of messagesToSend) {
    //       try {
    //         // Mark as sent in Redux
    //         dispatch(updateScheduledMessage({
    //           ...msg,
    //           sent: true
    //         }));
    
    //         // Send via socket
    //         socket.emit('send-scheduled-message', {
    //           ...msg,
    //           members: state.selectedchat.members.map(m => m._id),
    //           read: false,
    //           createdAt: new Date().toISOString(),
    //           scheduled: false,
    //           sent: true
    //         });
    
    //         //Update server status
    //         if (msg._id && typeof msg._id === 'string' && !msg._id.startsWith('temp-')) {
    //           await editScheduledMessage(msg._id, {
    //             sent: true,
    //             scheduled: false
    //           });
    //         }
    
    //         // Remove from scheduled list after successful send
    //         // dispatch(removeScheduledMessage(msg._id));
            
    //         // // Add to regular messages
    //         // setAllMessages(prev => [...prev, {
    //         //   ...msg,
    //         //   scheduled: false,
    //         //   sent: true,
    //         //   createdAt: new Date().toISOString()
    //         // }]);

            
    //         // Add to regular messages
    //         setAllMessages(prev => [...prev, {
    //           ...msg,
    //           scheduled: false,
    //           sent: true,
    //           createdAt: new Date().toISOString()
    //         }]);

    //         // Remove from scheduled list
    //         if (msg._id) {
    //           dispatch(removeScheduledMessage(msg._id));
    //         }
            
    //       } catch (error) {
    //         console.error('Failed to send:', error);
    //         // Revert on error
    //         dispatch(updateScheduledMessage({
    //           ...msg,
    //           sent: false
    //         }));
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Scheduled check error:', error);
    //   }
    // }, [socket, dispatch]);

    // const fetchScheduledMessages = async () => {
    //   try {
    //       dispatch(showLoader());
    //       const response = await getScheduledMessages(selectedchat._id);
    //       console.log("allscheduledmessage:",response.data)
    //       dispatch(hideLoader());
    //       if (response.success) {
    //         // Filter out already sent messages
    //         const messages = Array.isArray(response.data) ? response.data : [];
    //         const pendingMessages = messages.filter(msg => !msg.sent);
    //         dispatch(setScheduledMessages(pendingMessages));
            
    //         Check for any overdue messages
    //         const now = new Date();
    //         const overdueMessages = pendingMessages.filter(msg => 
    //           msg.scheduledFor && new Date(msg.scheduledFor) <= now
    //         );
            
    //         if (overdueMessages.length > 0) {
    //           checkAndSendScheduledMessages();
    //         }
    //       }
    //     }
    //    catch (error) {
    //       dispatch(hideLoader());
    //       toast.error(error.message);
    //        // Set empty array if error occurs
    //       dispatch(setScheduledMessages([]));
    //   }finally {
    //     dispatch(hideLoader());
    //   }
    // };
   const fetchScheduledMessages = async () => {
      try {
          dispatch(showLoader());
          const response = await getScheduledMessages(selectedchat?._id);
          console.log("allscheduledmessage:",response.data)
          dispatch(hideLoader());
          if (response.success) {
            // Filter out already sent messages
            const messages = Array.isArray(response.data) ? response.data : [];
            const pendingMessages = messages.filter(msg => !msg.sent);
            dispatch(setScheduledMessages(pendingMessages));
          }
          else{
            dispatch(setScheduledMessages([]));
          }
        }
       catch (error) {
          dispatch(hideLoader());
          toast.error(error.message);
           // Set empty array if error occurs
          dispatch(setScheduledMessages([]));
      }finally {
        dispatch(hideLoader());
      }
    };

    const getAllMessages=async()=>{
        try{
            dispatch(showLoader())
            const response=await getAllmesssage(selectedchat?._id)
            console.log("allMessages:",response.data)
            dispatch(hideLoader())
            if(response.success){
               const regularMessages=response.data.filter(msg=>!msg.scheduled)
                setAllMessages(regularMessages)
            }
        }
        catch(error){
            return error
        }
    }

   

    // Cancel a scheduled message
    const handleCancelScheduled = async (messageId) => {
      const response = await cancelScheduledMessage(messageId);
      if (response.success) {
        dispatch(removeScheduledMessage(messageId));
        toast.success("Message canceled");
      } else {
        toast.error(response.message);
      }
    };


    // Edit a scheduled message
    const handleEditScheduled = async (messageId, newContent, newTime) => {
      const response = await editScheduledMessage(messageId, {
        content: newContent,
        scheduledFor: newTime
      });
      if (response.success) {
        dispatch(updateScheduledMessage(response.data));
        toast.success("Message updated");
      } else {
        toast.error(response.message);
      }
    };


    const formatTime=(timestamp)=>{
      const now=moment()
      const diff=now.diff(moment(timestamp),'days')

      if(diff <1){
        return `Today ${moment(timestamp).format('hh:mm A')}`
      }
      else if(diff === 1){
        return `yesterday ${moment(timestamp).format('hh:mm A')}`
      }
      else{
        return moment(timestamp).format('MMM D,hh:mm A')
      }
    }
    const formatScheduledTime = (timestamp) => {
      return moment(timestamp).format('MMM D, hh:mm A');
    };
    // const clearUnreadMessage=async()=>{
    //   try{
    //     socket.emit('clear-unread-message',{
    //       chatId:selectedchat._id,
    //       members:selectedchat?.members?.map(m=>m._id)          
    //     })
    //     const response=await clearUnreadMessageCount(selectedchat._id)
     

    //     if(response.success){
    //        Allchats.map((eachchat)=>{
    //          if(eachchat._id === selectedchat._id){
    //            return response.data
    //          }
    //          return eachchat
    //        })      
    //     }

    //   }catch(error){
    //     toast.error(error.message)
    //   }
    // }
    const clearUnreadMessage = async () => {
      try {
        socket.emit('clear-unread-message', {
          chatId: selectedchat._id,
          members: selectedchat?.members?.map(m => m._id),
          senderId:user._id,
          isScheduled: false
        });
    
        const response = await clearUnreadMessageCount(selectedchat._id);
    
        if (response.success) {
          // Update regular messages
          setAllMessages(prev => prev.map(msg => ({
            ...msg,
            read: msg.chatId === selectedchat._id ? true : msg.read
          })));
    
          // Update scheduled messages using existing setScheduledMessages action
          dispatch(setScheduledMessages(
            scheduledMessages.map(msg => 
              msg.chatId === selectedchat._id 
                ? { ...msg, read: true } 
                : msg
            )
          ));
    
          // Update Allchats array
          const updatedChats = Allchats.map(chat => 
            chat._id === selectedchat._id
              ? { ...chat, unreadMessageCount: 0 }
              : chat
          );
          dispatch(setAllChats(updatedChats));

          // Emit separate event for scheduled messages
        if (scheduledMessages.some(msg => msg.chatId === selectedchat._id)) {
          socket.emit('mark-scheduled-read', {
            chatId: selectedchat._id,
            readerId: user._id,
            members: selectedchat.members.map(m => m._id)
          });
        }
        }
      } catch (error) {
        toast.error(error.message);
      }
    };

    function formatName(user){
      // console.log(`user-->${user}`)
      let fname=user?.firstName?.at(0).toUpperCase()+user?.firstName?.slice(1).toLowerCase();
      let lname=user?.LastName?.at(0).toUpperCase()+user?.LastName?.slice(1).toLowerCase();
      return fname+" "+lname
    }
 
    const sendImage=async(e)=>{
      const file=e.target.files[0]
      const reader=new FileReader(file)
      reader.readAsDataURL(file)
      reader.onloadend=async()=>{
        sendMessage(reader.result)
      }
    }
    
     // Debounced save draft function
    const saveDraftDebounced = useCallback(
      (chatId, message) => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          dispatch(saveChatDraft({ chatId, message }));
        }, 500); // Save after 500ms of inactivity
      },
      [dispatch]
    );


   // Update message change handler
    const handleMessageChange = (e) => {
      const newMessage = e.target.value;
      setMessage(newMessage);
      
      // Save draft
      if (selectedchat?._id) {
        saveDraftDebounced(selectedchat._id, newMessage);
      }
      
      // Typing indicator
      socket.emit('user-typing', {
        chatId: selectedchat._id,
        members: selectedchat.members.map(m => m._id),
        sender: user._id
      });
    };
  

    // useEffect(() => {
    //   // Check every 10 seconds (adjust interval as needed)
    //   const interval = setInterval(checkAndSendScheduledMessages, 10000);
      
    //   // Initial check when component mounts or dependencies change
    //   checkAndSendScheduledMessages();
      
    //   // Cleanup interval on unmount
    //   return () => clearInterval(interval);
    // }, [checkAndSendScheduledMessages]);

    
    
    useEffect(()=>{
        getAllMessages();
        fetchScheduledMessages();

        if(selectedchat?.lastMessage?.sender !== user?._id){
          clearUnreadMessage();
        }
        socket.off('receive-message').on('receive-message',(data)=>{
          const selectedchat=store.getState().userReducer.selectedchat
          if(selectedchat._id === data.chatId){
            setAllMessages(premsg=>[...premsg,data])
            // console.log("allmessage of selected chat:"+allMessages)
          }
          if(selectedchat._id === data.chatId && data.sender !== user._id){
            console.log("allmessage selected chat:"+allMessages);
            clearUnreadMessage();
          }
        })
        socket.off('message-count-cleared').on('message-count-cleared',(data)=>{
          let selectedchat=store.getState().userReducer.selectedchat 
          let Allchats=store.getState().userReducer.Allchats 
          if(selectedchat?._id === data.chatId){
            //update unread message count in chat
            const updatedchats=Allchats.map((eachchat)=>{
              if(eachchat?._id === data.chatId){
                return{
                  ...eachchat,
                  unreadMessageCount:0
                }
              }
              return eachchat
            })
            Allchats=updatedchats
          }
          dispatch(setAllChats(Allchats))
          
          //update read property in message object
          setAllMessages(previousmessage=>{
            return previousmessage.map(eachmessage=>{
              return {
                ...eachmessage,read:true
              }
            })
          })
        })
        socket.off('started-typing').on('started-typing',(data)=>{
          setdata(data)
          if(selectedchat?._id === data.chatId && data.sender !== user?._id){
            setisTyping(true)
            setTimeout(()=>{
              setisTyping(false)
            },2000)
          }
        })
        socket.off('user-deleted').on('user-deleted', (data) => {
         let selectedchat=store.getState().userReducer.selectedchat 
          dispatch(setMarkUserAsDeleted(data.userId));
          
          // If the deleted user is in the current chat, show a message
          if (selectedchat?.members.some(m => m._id === data.userId)) {
              // 1. Update local state immediately
              dispatch(updateCurrentChatUser({
                deleted: true,
                firstName: 'Deleted',
                LastName: 'User',
                ProfilePic: null,
                email: `deleted-${Date.now()}@example.com`
              }));
              // setCurrentChatUser(prev => ({
              //   ...prev,
              //   deleted: true,
              //   deleted: true,
              //   deletedAt: new Date(),
              //   // Clear sensitive data
              //   firstName: 'Deleted',
              //   LastName: 'User',
              //   email: `deleted-${Date.now()}@example.com`,
              //   ProfilePic: null
              // }));

              // 2. Show toast
              toast('This user has deleted their account', {
                  icon: 'ℹ️',
                  duration: 4000
              });

               // 3. Disable message input
              setMessage(''); // Clear any draft
          }
      });
        // socket.off('scheduled-message-count-cleared').on('scheduled-message-count-cleared', (data) => {
        //   let currentSelectedChat = store.getState().userReducer.selectedchat;
          
        //   // Only process if it's for the current chat
        //   if (currentSelectedChat._id === data.chatId) {
        //     // Update read status in scheduled messages
        //     dispatch(updateScheduledMessage({
        //       _id: data.messageId,
        //       read: true,
        //       // readAt: data.readAt
        //     }));
      
        //     // Also update in allMessages if the message exists there
        //     setAllMessages(prev => prev.map(msg => 
        //       msg._id === data.messageId ? { ...msg, read: true } : msg
        //     ));
        //   }
        // });
    },[selectedchat,dispatch])

    
    // When selectedchat changes
    useEffect(() => {

      // setMessage('');
      // setShowEmojiPicker(false);
      if (selectedchat) {
        const chatUser = selectedchat?.members.find(u => u?._id !== user?._id);
        dispatch(setCurrentChatUser(chatUser));
      }
    }, [selectedchat, user?._id, dispatch]);

    // Update your socket listener
    useEffect(() => {
      const handleScheduledMessageUpdate = (updatedMessage) => {
        // Verify the message structure
        if (!updatedMessage._id || !updatedMessage.chatId) {
          console.error('Invalid message structure in update');
          return;
        }
    
        // Only process if it's for the current chat
        if (selectedchat?._id === updatedMessage.chatId) {
          dispatch(updateScheduledMessage({
            ...updatedMessage,
            // Ensure these flags are always set correctly
            scheduled: true,
            sent: false
          }));
        }
      };
    
      socket.on('scheduled-message-updated', handleScheduledMessageUpdate);
    
      return () => {
        socket.off('scheduled-message-updated', handleScheduledMessageUpdate);
      };
    }, [socket, dispatch, selectedchat]);

    useEffect(() => {
      const handleScheduledMessageSent = async(data) => {
         //try by me when handle by server
         dispatch(updateScheduledMessage({...data,sent:true}))
       
        //try by me -update server status
            if (data._id && typeof data._id === 'string' && !data._id.startsWith('temp-')) {
              await editScheduledMessage(msg._id, {
                sent: true,
                scheduled: false
              });
            }
        //try by me when handle by server
        dispatch(updateScheduledMessage({...data,sent:true}))

        //Remove from scheduled messages list if it's for the current chat
        // if (selectedchat?._id === data.chatId) {
        //   dispatch(removeScheduledMessage(data._id));
        // }
      };
    
      const handleNewMessage = (message) => {
        // Add to regular messages if it's for the current chat
        if (selectedchat?._id === message.chatId) {
          setAllMessages(prev => [...prev, message]);
        }
      };
    
      socket.on('scheduled-message-sent', handleScheduledMessageSent);
      socket.on('schedule-receive-message', handleNewMessage);
    
      return () => {
        socket.off('scheduled-message-sent', handleScheduledMessageSent);
        socket.off('schedule-receive-message', handleNewMessage);
      };
    }, [socket, dispatch, selectedchat]);


    useEffect(()=>{
      let messagecontainer=document.getElementById('main-chat-area')
      if (messagecontainer) {
        messagecontainer.scrollTop = messagecontainer.scrollHeight;
      }
    },[allMessages,isTyping])

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.altKey && e.key.toLowerCase() === 'a' && !isAIModalOpen) {
          onAIModalOpen();
        }
      };
    
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAIModalOpen, onAIModalOpen]);

    
     // Load draft when chat changes
  useEffect(() => {
    if (selectedchat?._id) {
      const draft = chatDrafts[selectedchat._id] || '';
      setMessage(draft);
    }
  }, [selectedchat?._id, chatDrafts]);


  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

    
    
    return (
      <>
          {selectedchat && (
              <div className="app-chat-area">
                  <div className="app-chat-area-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                         <span style={{ color: currentChatUser?.deleted ? '#e74c3c' : 'inherit' }}>
                           {currentChatUser?.deleted ? 'Deleted User' : formatName(currentChatUser)}
                        </span>
                        {currentChatUser?.deleted && (
                          <div className="deleted-notice">
                            <i className="fa fa-ban"></i> This account has been removed
                          </div>
                        )}
                         </div>
                          <button 
                              onClick={() => setShowScheduledList(!showScheduledList)}
                              style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: showScheduledList ? '#e74e3c' : '#333'
                              }}
                              title={showScheduledList ? "View regular chat" : "View scheduled messages"}
                          >
                              <TimeIcon />
                          </button>
                      </div>
                  </div>

                  {showScheduledList ? (
                  <div style={{ 
                    height: 'calc(100% - 120px)', // Adjust based on your header/footer heights
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <ScheduledMessagesList 
                      scheduledMessages={Array.isArray(scheduledMessages) ? 
                        scheduledMessages.filter(msg => msg.chatId === selectedchat._id) : 
                        []}
                      onCancel={handleCancelScheduled}
                      onEdit={handleEditScheduled}
                    />
                  </div>
                ): (
                      <>
                          <div className="main-chat-area" id="main-chat-area">
                              {allMessages.map((eachmessage) => {
                                  const isCurrentUserSender = eachmessage?.sender === user?._id;
                                  const scheduledMsg = scheduledMessages.find(m => m._id === eachmessage._id);
                                   const isRead = eachmessage.read || (scheduledMsg && scheduledMsg.read);
                  
                                  return (
                                      <div
                                          className="message-container"
                                          style={isCurrentUserSender ? { justifyContent: 'end' } : { justifyContent: 'start' }}
                                          key={eachmessage._id}
                                      >
                                          <div>
                                              <div className={isCurrentUserSender ? "send-message" : "received-message"}>
                                                  <div>{eachmessage.text}</div>
                                                  <div>{eachmessage.image &&
                                                      <img src={eachmessage.image} alt="image" height="120" width="120"></img>}</div>
                                              </div>
                                              <div
                                                  className="message-timestamp"
                                                  style={isCurrentUserSender ? { float: 'right' } : { float: 'left' }}
                                              >
                                                  {formatTime(eachmessage.createdAt)}
                                                  {isCurrentUserSender && (eachmessage.read || isRead) &&
                                                      <i className="fa fa-check-circle" aria-hidden='true' style={{ color: "#e74e3c" }}>
                                                      </i>}
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })}
                              <div className="typing-indicator">
                                {isTyping && selectedchat?.members?.map(m => m._id).includes(data?.sender) && <i>typing...</i>}
                              </div>
                          </div>

                          {showEmojiPicker && (
                              <div style={{ width: '100%', display: 'flex', padding: '0px 20px', justifyContent: 'right' }}>
                                  <EmojiPicker onEmojiClick={(e) => setMessage(message + e.emoji)} style={{ width: '300px', height: '400px' }}></EmojiPicker>
                              </div>
                          )}
                      </>
                  )}

                  <ScheduleMessageModal
                      isOpen={isScheduleModalOpen}
                      onClose={onScheduleModalClose}
                      chatId={selectedchat._id}
                      message={message}
                      setMessage={setMessage}
                      onSchedule={(scheduledTime) => {
                          sendMessage(null, scheduledTime);
                          onScheduleModalClose();
                      }}
                  />
                  <AIMessageModal
                  isOpen={isAIModalOpen}
                  onClose={() => {
                    onAIModalClose();
                    dispatch(clearAIResponse());
                  }}
                  onSend={(aiMessage) => {
                    setMessage(aiMessage); // Populate input with AI message
                    // Optionally auto-focus the input after:
                    // document.querySelector('.send-message-input')?.focus();
                  }}
                />

                 {!showScheduledList && <div className="send-message-div">
                     <div className={currentChatUser?.deleted ? "disabled-chat-area" : ""}> 
                      <textarea
                          type="text"
                          className="send-message-input"
                          placeholder="Type a message"
                          value={message}
                          disabled={currentChatUser?.deleted}
                          onChange={handleMessageChange}
                         rows='1' 
                      />
                      <label htmlFor="file">
                          <i className="fa fa-picture-o send-image-btn"></i>
                          <input
                              type="file"
                              id="file"
                              style={{ display: 'none' }}
                              accept="image/jpg,image/jpeg,image/gif,image/png"
                              onChange={sendImage}
                              disabled={currentChatUser?.deleted}
                          >
                          </input>
                      </label>
                      <button
                          onClick={() => { setShowEmojiPicker(!showEmojiPicker) }}
                          className="fa fa-smile-o send-emoji-btn"
                          // aria-hidden="true"
                          aria-label="Send emoji"
                          disabled={currentChatUser?.deleted}
                      >
                      </button>
                      <button
                          className="schedule-btn"
                          onClick={onScheduleModalOpen}
                          disabled={currentChatUser?.deleted}
                      >
                          <CalendarIcon  />
                      </button>
                      <button
                          onClick={() => sendMessage('')}
                          className="fa fa-paper-plane send-message-btn"
                          // aria-hidden="true"
                          aria-label="Send message"
                      >
                      </button>
                      <Tooltip 
                      label="AI Assistant" 
                      placement="top"
                      hasArrow
                      bg={currentTheme === 'dark' ? 'gray.700' : 'gray.600'}
                      color="white"
                      fontSize="sm"
                      py={1}
                      px={2}
                      borderRadius="md"
                      // openDelay={300} // Shows after 300ms of hover
                    >
                      <button
                        className={`ai-assist-btn ${isAIModalOpen ? 'active' : ''}`}
                        onClick={onAIModalOpen}
                        disabled={currentChatUser?.deleted}
                        aria-label="AI Message Assistant"
                      >
                        {/* <i className="fas fa-robot"></i> */}
                        <i className="fas fa-sparkles" style={{ color: '#6e40ff' }}></i>
                        <i className="fas fa-sparkle fa-pulse"></i>
                        {/* <i className="fas fa-bolt fa-bounce"></i>  */}
                        
                      </button>
                     </Tooltip>
                     </div> 
                  </div>}
              </div>
          )}
      </>
  );
}

export default Chatarea;