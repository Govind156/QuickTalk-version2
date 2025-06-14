import React, { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Select,
  Textarea,
  Box,
  Text,
  IconButton,
  useClipboard
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import { useSelector, useDispatch } from 'react-redux';
import { setAIResponse, setAILoading, setAIError, clearAIResponse } from '../../../redux/usersSlice';
import axios from 'axios';
import {generateAImessage} from '../../../apiCalls/message'

const TONE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'funny', label: 'Funny' },
  { value: 'romantic', label: 'Romantic' }
];


const AIMessageModal = ({ isOpen, onClose, onSend }) => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('default');
  const toast = useToast();
  const dispatch = useDispatch();
  const { aiResponse, aiLoading } = useSelector(state => state.userReducer);  
  const { hasCopied, onCopy } = useClipboard(aiResponse || '');
 
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

  const generateMessage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Please enter a prompt',
        status: 'warning',
        isClosable: true,
        position: 'bottom',
      });
      return;
    }

    try {
      
      const finalprompt= {prompt: tone !== 'default' ? `${prompt} (${tone} tone)` : prompt}
      
      
      if(finalprompt.prompt === undefined){
        return;
      }
      dispatch(setAILoading());

      const {success, data, message} = await generateAImessage( {prompt:finalprompt.prompt});
      
      


      if (success) {
        dispatch(setAIResponse(data.data));
      } else {
        throw new Error(message || 'Generation failed');
      }

    } catch (error) {
      dispatch(setAIError(error.message));
      toast({
        title: 'Failed to generate message',
        description: error.message,
        status: 'error',
        isClosable: true,
        position: 'bottom',
      });
    }
    
  };

  const handleSend = () => {
    if (aiResponse) {
      onSend(aiResponse);
      dispatch(clearAIResponse());
      setPrompt('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {
      dispatch(clearAIResponse());
      setPrompt('');
      onClose();
    }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>AI Message Generator</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
        <Box mb={4}>
          <Text mb={2} fontWeight="semibold">Select Tone:</Text>
          <Select 
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            size="sm"
            bg={currentTheme === 'dark' ? 'gray.700' : 'white'}
            >
            {TONE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Box>
          <Textarea
            placeholder="What would you like the AI to write? (e.g. 'A funny birthday message')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            mb={4}
          />

          {aiLoading && <Text>Generating...</Text>}

          {aiResponse && (
            <Box borderWidth="1px" borderRadius="lg" p={4} mt={4}>
              <Text mb={2} whiteSpace="pre-wrap">{aiResponse}</Text>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <IconButton
                  icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
                  onClick={onCopy}
                  aria-label="Copy message"
                  mr={2}
                  size="sm"
                />
                <IconButton
                  icon={<CloseIcon />}
                  onClick={() => dispatch(clearAIResponse())}
                  aria-label="Clear message"
                  size="sm"
                />
              </Box>
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          <Button 
            colorScheme="blue" 
            mr={3} 
            isLoading={aiLoading}
            onClick={generateMessage}
          >
            Generate
          </Button>
          <Button 
            colorScheme="green" 
            mr={3} 
            isDisabled={!aiResponse}
            onClick={handleSend}
          >
            Paste
          </Button>
          <Button onClick={() => {
            dispatch(clearAIResponse());
            setPrompt('');
            onClose();
          }}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AIMessageModal;