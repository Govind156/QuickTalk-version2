import {createSlice} from '@reduxjs/toolkit'
const userSlice=createSlice({
    name:'user',
    initialState:{
        user:null,
        Alluser:[],
        Allchats:[],
        selectedchat:null,
        scheduledMessages: [],
        aiResponse: null,
        aiLoading: false,
        aiError: null,
        aiTone: 'default',
        currentChatUser: null,
        chatDrafts: {},
    },
    reducers:{
        setUser:(state,action)=>{state.user=action.payload;},
        setAllUser:(state,action)=>{state.Alluser=action.payload;},
        setAllChats:(state,action)=>{state.Allchats=action.payload;},
        setSelectedChat:(state,action)=>{state.selectedchat=action.payload;},
        setScheduledMessages: (state, action) =>{state.scheduledMessages = action.payload;},
        // addScheduledMessage: (state, action) => {  
        //     if (!Array.isArray(state.scheduledMessages)) {
        //      state.scheduledMessages = [];
        //     }
        //       // Ensure payload exists and has required properties
        //     if (!action.payload || !action.payload._id) {
        //       console.error("Invalid message data in addScheduledMessage");
        //       return;
        //     }
        //      // Remove if temporary message exists
        //     state.scheduledMessages = state.scheduledMessages.filter(
        //         msg => !(msg._id.startsWith('temp-') && 
        //             msg.sender === action.payload.sender &&
        //             msg.chatId === action.payload.chatId)
        //     );
        //     state.scheduledMessages.push(action.payload);
        // },
        addScheduledMessage: (state, action) => {
          if (!Array.isArray(state.scheduledMessages)) {
            state.scheduledMessages = [];
          }
          
          // Ensure payload exists and has required properties
          if (!action.payload || !action.payload._id) {
            console.error("Invalid message data in addScheduledMessage");
            return;
          }
          
          // Safe filtering with null checks
          state.scheduledMessages = state.scheduledMessages.filter(
            msg => {
              // Skip invalid messages in filter
              if (!msg || !msg._id || !action.payload || !action.payload.sender || !action.payload.chatId) {
                return true; // Keep message if we can't properly evaluate it
              }
              
              // Check if it's a temp message from the same sender/chat
              const isTempFromSameSender = 
                typeof msg._id === 'string' && 
                msg._id.startsWith('temp-') &&
                msg.sender === action.payload.sender && 
                msg.chatId === action.payload.chatId;
                
              return !isTempFromSameSender; // Keep if NOT a temp message from same sender/chat
            }
          );
          
          state.scheduledMessages.push(action.payload);
        },
        // removeScheduledMessage: (state, action) => {state.scheduledMessages = state.scheduledMessages.filter(msg => msg._id !== action.payload);
        // },
        removeScheduledMessage: (state, action) => {
          if (!action.payload) {
            console.error("Invalid ID in removeScheduledMessage");
            return;
          }
          
          if (!Array.isArray(state.scheduledMessages)) {
            state.scheduledMessages = [];
            return;
          }
          
          state.scheduledMessages = state.scheduledMessages.filter(
            msg => msg && msg._id !== action.payload
          );
        },
        // updateScheduledMessage: (state, action) => {
        //     if (!Array.isArray(state.scheduledMessages)) {
        //       state.scheduledMessages = [];
        //     }
            
        //     const existingIndex = state.scheduledMessages.findIndex(
        //       msg => msg._id === action.payload._id
        //     );
            
        //     if (existingIndex >= 0) {
        //       // Preserve critical scheduling fields
        //       state.scheduledMessages[existingIndex] = {
        //         ...action.payload,
        //         scheduled: true,  // Always maintain as true for updates
        //         sent: false       // Always maintain as false for updates
        //       };
        //     } else {
        //       // For new messages, ensure scheduling flags are set
        //       state.scheduledMessages.push({
        //         ...action.payload,
        //         scheduled: true,
        //         sent: false
        //       });
        //     }
        // },
        updateScheduledMessage: (state, action) => {
          if (!Array.isArray(state.scheduledMessages)) {
            state.scheduledMessages = [];
          }
          
          const existingIndex = state.scheduledMessages.findIndex(
            msg => msg._id === action.payload._id
          );
          
          if (existingIndex >= 0) {
            state.scheduledMessages[existingIndex] = {
              ...state.scheduledMessages[existingIndex],
              ...action.payload,
              // Only override these flags if explicitly provided
              scheduled: action.payload.hasOwnProperty('scheduled') 
                ? action.payload.scheduled 
                : state.scheduledMessages[existingIndex].scheduled || true,
              sent: action.payload.hasOwnProperty('sent')
                ? action.payload.sent
                : state.scheduledMessages[existingIndex].sent || false
            };
          } else {
            // For new messages, ensure scheduling flags are set
            state.scheduledMessages.push({
              ...action.payload,
              scheduled: action.payload.scheduled ?? true,
              sent: action.payload.sent ?? false
            });
          }
        },
        setAddNewUser: (state, action) => {
          // Check if user already exists in Alluser array
          const userExists = state.Alluser.some(user => user._id === action.payload._id);
          if (!userExists) {
              state.Alluser.push(action.payload);
          }
        },
        setMarkUserAsDeleted: (state, action) => {
        const userId = action.payload;
        // Update Alluser array
        state.Alluser = state.Alluser.map(user => 
            user._id === userId ? { ...user, deleted: true } : user
        );
        // Update Allchats to mark deleted users
        state.Allchats = state.Allchats.map(chat => ({
            ...chat,
            members: chat.members.map(member => 
                member._id === userId ? { ...member, deleted: true } : member
            )
        }));
        },
        setAIResponse: (state, action) => {
          state.aiResponse = action.payload;
          state.aiLoading = false;
        },
        setAILoading: (state) => {
          state.aiLoading = true;
          state.aiError = null;
        },
        setAIError: (state, action) => {
          state.aiError = action.payload;
          state.aiLoading = false;
        },
        clearAIResponse: (state) => {
          state.aiResponse = null;
          state.aiError = null;
        },
        setAITone: (state, action) => {
          state.aiTone = action.payload;
        },
        setCurrentChatUser: (state, action) => {
          state.currentChatUser = action.payload;
        },
        updateCurrentChatUser: (state, action) => {
          if (state.currentChatUser) {
            state.currentChatUser = {
              ...state.currentChatUser,
              ...action.payload
            };
          }
        },
        saveChatDraft: (state, action) => {
          const { chatId, message } = action.payload;
          state.chatDrafts[chatId] = message;
        },
        clearChatDraft: (state, action) => {
          const { chatId } = action.payload;
          delete state.chatDrafts[chatId];
        }

    }
})
export const {setUser,setAllUser,
    setAllChats,setSelectedChat,
    addScheduledMessage,
    removeScheduledMessage,
    updateScheduledMessage,
    setScheduledMessages,
    setAddNewUser,
    setMarkUserAsDeleted,
     setAIError,setAIResponse,
     setAILoading,
     clearAIResponse,setCurrentChatUser,
     updateCurrentChatUser,
    saveChatDraft,clearChatDraft}=userSlice.actions
export default userSlice.reducer;

