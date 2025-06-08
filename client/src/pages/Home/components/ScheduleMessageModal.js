import React, { useState } from 'react';
// import { useToast } from "@chakra-ui/toast";
import { Center, useToast } from '@chakra-ui/react'; 
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton
} from '@chakra-ui/modal';
import { Button } from '@chakra-ui/button';
import { Input } from "@chakra-ui/react"; 
import {FormControl} from '@chakra-ui/form-control'
import { Box, Text } from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import axios from 'axios';
// import { ChatState } from '../Context/ChatProvider';
import { useSelector } from 'react-redux';

const ScheduleMessageModal = ({ isOpen, onClose, chatId, message, onSchedule,setMessage }) => {
  // const [message, setMessage] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useSelector(state => state.userReducer);
  
  const handleSchedule = async () => {
    if (!message || !dateTime) {
      toast({ title: 'Please fill all fields', status: 'warning' });
      return;
    }
    // Add validation for future time
    const selectedDateTime = new Date(dateTime);
    const currentDateTime = new Date();
    
    if (selectedDateTime <= currentDateTime) {
      toast({ 
        title: 'Please select a future time', 
        status: 'warning',
        duration: 3000,
        isClosable: true ,
      });
      return;
    }

    try {
      setLoading(true);
      onSchedule(new Date(dateTime).toISOString());
      onClose();
    } catch (error) {
      toast({ title: 'Error scheduling message', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Schedule Message</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl>
            <Input
              placeholder="Type your message here"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              mb={3}
            />
          </FormControl>
          
          <Box mb={3}>
            <Text mb={2} fontSize="sm">Schedule date and time:</Text>
            <Input
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            isLoading={loading}
            onClick={handleSchedule}
          >
            Schedule
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ScheduleMessageModal;