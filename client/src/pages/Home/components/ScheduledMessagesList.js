import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useToast } from '@chakra-ui/react'; 
import {
  Box,
  Text,
  Heading,
  Stack,
  Flex,
  Badge,
  useDisclosure
} from '@chakra-ui/react';

// Modal components from @chakra-ui/modal
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/modal';

// Form components from @chakra-ui/form-control
import { Input} from "@chakra-ui/react"; 
import {FormControl} from '@chakra-ui/form-control'

// Button components from @chakra-ui/button
import { Button, IconButton } from '@chakra-ui/button';

import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import axios from 'axios';
// import { ChatState } from '../Context/ChatProvider';
import { useSelector, useDispatch } from 'react-redux';
import {removeScheduledMessage,updateScheduledMessage,addScheduledMessage,setScheduledMessages} from '../../../redux/usersSlice'
import { cancelScheduledMessage, editScheduledMessage ,getScheduledMessages} from '../../../apiCalls/message';


const ScheduledMessagesList = ({socket,onCancel,onEdit}) => {
  
  const {user,selectedchat}=useSelector(state=>state.userReducer)

  const dispatch = useDispatch();
  const toast = useToast();
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedDateTime, setEditedDateTime] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const scheduledMessages = useSelector(state => state.userReducer.scheduledMessages);

 
  const openEditModal = (message) => {
    setEditingMessage(message);
    setEditedContent(message.text || '');
    setEditedDateTime(moment(message.scheduledFor).format('YYYY-MM-DDTHH:mm'));
    setIsEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editedContent || !editedDateTime) {
      toast({ title: 'Please fill all fields', status: 'warning' });
      return;
    }
    if (!editingMessage || !editingMessage._id) {
      toast({ title: 'Invalid message data', status: 'error' });
      return;
    }
    if (new Date(editedDateTime) < new Date()) {
     toast({ title: 'Time must be in the future', status: 'warning' });
     return;
    }
  
    try {
      setIsUpdating(true);
      
      // For temporary messages (not yet saved to DB)
      if (typeof editingMessage._id === 'string' && editingMessage._id.startsWith('temp-')) {
        dispatch(updateScheduledMessage({
          ...editingMessage,
          text: editedContent,
          scheduledFor: new Date(editedDateTime).toISOString(),
          // Maintain scheduled status
          scheduled: true,
          sent: false
        }));
        setIsEditModalOpen(false);
        toast({ title: 'Changes saved', status: 'success' });
        return;
      }

      // For existing messages in DB
      const response = await editScheduledMessage(editingMessage._id, {
        text: editedContent,
        scheduledFor: new Date(editedDateTime).toISOString(),
        // Explicitly maintain these flags
        scheduled: true,
        sent: false
      });

      if (response.success) {
        setIsEditModalOpen(false);
        toast({ title: 'Message updated', status: 'success' });
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch(updateScheduledMessage(editingMessage));
      toast({
        title: 'Error updating message',
        description: error.message || 'unknown error',
        status: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  // Handle message cancellation
  const handleCancel = async (messageId) => {
    if (!messageId) {
      toast({ title: 'Invalid message ID', status: 'error' });
      return;
    }
    try {
      setIsDeleting(true);
      
      // For temporary messages
      if (typeof messageId === 'string' && messageId.startsWith('temp-')) {
        dispatch(removeScheduledMessage(messageId));
        toast({ title: 'Message removed', status: 'success' });
        return;
      }

      // For database messages
      const response = await cancelScheduledMessage(messageId);
      if (response.success) {
        dispatch(removeScheduledMessage(messageId));
        toast({ title: 'Message canceled', status: 'success' });
      }
    } catch (error) {
      toast({
        title: 'Error canceling message',
        description: error.message,
        status: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
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
              scheduled: false,
              sent: true,
              scheduledFor:null
            }));
          }
        };
      
        socket.on('scheduled-message-updated', handleScheduledMessageUpdate);
      
        return () => {
          socket.off('scheduled-message-updated', handleScheduledMessageUpdate);
        };
  }, [socket, dispatch, selectedchat]);

  return (
    <Box p={3} height="100%" display="flex" flexDirection="column">
      <Text fontSize="xl" fontWeight="bold" mb={4} color="red.500">
        Scheduled Messages
      </Text>

     
      {scheduledMessages.length === 0 ? (
      <Box textAlign="center" py={5}>
        <Text color="gray.500">No scheduled messages</Text>
      </Box>
    ) : (
      <Box flex="1" overflowY="auto">
        {scheduledMessages.map((msg) => (
          <Box 
            key={msg._id} 
            borderWidth="1px" 
            borderRadius="md" 
            p={3}
            mb={3}
            bg={msg.sent ? "gray.50" : "white"}
            boxShadow="sm"
          >
            <Flex justify="space-between" align="center" mb={2}>
              <Badge colorScheme={msg.sent ? "green" : "red"}>
                {msg.sent ? "Sent" : "Pending"}
              </Badge>
              <Text fontSize="sm" color="gray.500">
                {formatScheduledTime(msg.scheduledFor)}
              </Text>
            </Flex>

            <Text className='schedule-text' mb={2}>{msg.text || "(Image message)"}</Text>

            <Flex justify="flex-end">
              {!msg.sent && (
                <>
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    mr={2}
                    onClick={() => openEditModal(msg)}
                    aria-label="Edit message"
                    colorScheme="blue"
                    isLoading={isUpdating && editingMessage?._id === msg._id}
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleCancel(msg._id)}
                    aria-label="Cancel message"
                    isLoading={isDeleting}
                  />
                </>
              )}
            </Flex>
          </Box>
        ))}
      </Box>
    )}

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Scheduled Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <Input
                placeholder="Message content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                mb={3}
              />
            </FormControl>

            <FormControl>
              <Text mb={2}>Scheduled time:</Text>
              <Input
                type="datetime-local"
                value={editedDateTime}
                min={moment().format('YYYY-MM-DDTHH:mm')} // Prevent past dates
                onChange={(e) => setEditedDateTime(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={handleEdit}
              isLoading={isUpdating}
            >
              Update
            </Button>
            <Button onClick={() => setIsEditModalOpen(false)}
              isDisabled={isUpdating}>
            Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};



export default ScheduledMessagesList;