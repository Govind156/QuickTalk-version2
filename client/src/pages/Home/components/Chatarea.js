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
import MarkdownEditorModal from "./MarkdownEditorModal";
import { Tooltip } from '@chakra-ui/react'
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import ReactMarkdown from 'react-markdown';



function Chatarea({socket}){
    const {currentChatUser,selectedchat,user,Allchats,scheduledMessages,chatDrafts}=useSelector(state=>state.userReducer)
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
    
    const {
      isOpen: isMarkdownEditorOpen,
      onOpen: onMarkdownEditorOpen,
      onClose: onMarkdownEditorClose
    } = useDisclosure();
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
     const mdParser = new MarkdownIt();
   
   
   
  
   


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
   const fetchScheduledMessages = async () => {
      try {
          dispatch(showLoader());
          const response = await getScheduledMessages(selectedchat?._id);
          dispatch(hideLoader());
          if (response.success) {
            // Filter out already sent messages
            const messages = Array.isArray(response.data) ? response.data : [];
            const pendingMessages = messages.filter(msg => msg.scheduled && !msg.sent);
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
        text: newContent,
        scheduledFor: newTime,
        scheduled:true,
        sent:false,
      });
      if (response.success) {
        dispatch(updateScheduledMessage(response.data));
        // fetchScheduledMessages();
        toast.success("Message updated");
      } else {
        toast.error(response.message);
      }
    };

    const formatScheduledTime = (timestamp) => {
      return moment(timestamp).format('MMM D, hh:mm A');
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

    const handleEditorChange = ({ text }) => {
      setMessage(text);

      // Save draft
      if (selectedchat?._id) {
        saveDraftDebounced(selectedchat._id, text);
      }

      // Typing indicator
      socket.emit('user-typing', {
        chatId: selectedchat._id,
        members: selectedchat.members.map(m => m._id),
        sender: user._id
      });
    };

  

   

    
    
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
          }
          if(selectedchat._id === data.chatId && data.sender !== user._id){
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

              // 2. Show toast
              toast('This user has deleted their account', {
                  icon: 'ℹ️',
                  duration: 4000
              });

               // 3. Disable message input
              setMessage(''); // Clear any draft
              dispatch(clearChatDraft({ chatId: selectedchat._id }));
              setShowEmojiPicker(false);
          }
      });
    },[selectedchat,dispatch])

    
    // When selectedchat changes
    useEffect(() => {

     
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
         
       
        //try by me -update server status
            if (data._id && typeof data._id === 'string' && !data._id.startsWith('temp-')) {
              const response=await editScheduledMessage(data._id, {
                sent: true,
                scheduled: false,
                scheduledFor:null,
                text:data.text
              });

              if (response.success) {
              dispatch(updateScheduledMessage(response.data));  
              } 


            }
        //try by me when handle by server
        //  dispatch(updateScheduledMessage({...data,sent:true,
        //         scheduled: false,
        //         scheduledFor:null,}))

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
                        scheduledMessages.filter(msg => 
                             msg.chatId === selectedchat._id && 
                             msg.scheduled && 
                             !msg.sent) : 
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
                                                  <div>
                                                    <ReactMarkdown>{eachmessage.text}</ReactMarkdown>
                                                  </div>
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
                  }}
                 />
                  <MarkdownEditorModal
                    isOpen={isMarkdownEditorOpen}
                    onClose={onMarkdownEditorClose}
                    message={message}
                    setMessage={setMessage}
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
                      {/* <MdEditor
                        value={message}
                        className="send-message-input"
                        style={{ height: '200px' }}
                        renderHTML={(text) => mdParser.render(text)}
                        onChange={handleEditorChange}
                        readOnly={currentChatUser?.deleted}
                      /> */}
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
                      {/* <Tooltip 
                      label="AI Assistant" 
                      placement="top"
                      hasArrow
                      bg={currentTheme === 'dark' ? 'gray.700' : 'gray.600'}
                      color="white"
                      fontSize="sm"
                      py={1}
                      px={2}
                      borderRadius="md"
                    >
                      <button
                        className={`fa-solid fa-wand-sparkles ai-assist-btn ${isAIModalOpen ? 'active' : ''}`}
                        onClick={onAIModalOpen}
                        disabled={currentChatUser?.deleted}
                        aria-label="AI Message Assistant"
                      >
                        <i className="fa-solid fa-wand-sparkles" style={{ color: '#6e40ff' }}></i>
                      </button>
                     </Tooltip> */}

                      <button
                        className="fa-solid fa-wand-sparkles ai-assist-btn"
                        onClick={onAIModalOpen}
                        disabled={currentChatUser?.deleted}
                        aria-label="AI Message Assistant"
                      ></button>


                     <button
                        className="fa fa-edit format-message-btn"
                        onClick={onMarkdownEditorOpen}
                        disabled={currentChatUser?.deleted}
                        aria-label="format message"
                     >
                     </button>
                     </div> 
                  </div>}
              </div>
          )}
      </>
  );
}

export default Chatarea;