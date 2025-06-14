import React from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import ReactMarkdown from 'react-markdown';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button
} from '@chakra-ui/react';

const MarkdownEditorModal = ({ isOpen, onClose, message, setMessage }) => {
  const handleEditorChange = ({ text }) => {
    setMessage(text);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Format Message</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <MdEditor
            value={message}
            style={{ height: '300px' }}
            renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
            onChange={handleEditorChange}
          />
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MarkdownEditorModal;
