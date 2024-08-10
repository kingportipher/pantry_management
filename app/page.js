'use client'
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { firestore } from '@/firebase';
import { Typography, Box, Modal, Stack, TextField, Button } from "@mui/material";
import { collection, deleteDoc, getDocs, query, getDoc, doc, setDoc } from "firebase/firestore";
import {Configuration, OpenAIApi} from "openai";

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item) => {
    if (!item) {
      console.error("Item name cannot be empty");
      return;
    }
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    if (!item) {
      console.error("Item name cannot be empty");
      return;
    }
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const startCamera = () => {
    setCameraOpen(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
      });
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
    setCameraOpen(false);

    // Stop the video stream
    video.srcObject.getTracks().forEach(track => track.stop());
  };

  const classifyImage = async () => {
    if (!capturedImage) {
      console.error("No image captured");
      return;
    }
  
    try {
      const configuration = new Configuration({
        apiKey: apiKey,
      });
      const openai = new OpenAIApi(configuration);
  
      // Prepare the image data for sending to the OpenAI API
      const response = await openai.createImage({
        image: capturedImage.split(',')[1], // Remove the base64 header
        purpose: 'classify', // This can be adjusted based on your needs
      });
  
      // Get the classification result
      const classificationResult = response.data.label || "Unrecognized Item";
  
      // Add classified item to inventory
      await addItem(classificationResult);
      handleClose();
    } catch (error) {
      console.error("Error classifying image:", error);
    }
  };

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2}>
      <Modal open={open} onClose={handleClose}>
        <Box position="absolute" top="50%" left="50%"
          width={400} bgcolor="white" p={4} boxShadow={24}
          display="flex" flexDirection="column"
          gap={3}
          sx={{ transform: "translate(-50%, -50%)" }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
              }} />
            <Button variant="contained"
              onClick={() => {
                if (itemName) {
                  addItem(itemName);
                  setItemName('');
                  handleClose();
                } else {
                  console.error("Item name cannot be empty");
                }
              }}
              disabled={!itemName} // Disable button if itemName is empty
            >Add</Button>
          </Stack>
          <Button variant="contained" onClick={startCamera}>Use Camera</Button>
          {cameraOpen && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <video ref={videoRef} autoPlay />
              <Button variant="contained" onClick={captureImage}>Capture</Button>
            </Box>
          )}
          {capturedImage && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Image
                src={capturedImage}
                alt="Captured"
                layout="responsive"
                width={400} // Adjust the width to fit your layout
                height={300} // Adjust the height to fit your layout
              />
              <Button variant="contained" onClick={classifyImage}>Classify & Add</Button>
            </Box>
          )}
        </Box>
      </Modal>
      <Button variant="contained"
        onClick={() => {
          handleOpen();
        }}>
        Add New Item
      </Button>
      <Box border="1px solid #333">
        <Box width="800px"
          height="100px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="center"
        >
          <Typography variant="h2" color="#333">Inventory Items</Typography>
        </Box>

        <Stack width="800px" height="300px" spacing={2} overflow="auto">
          {inventory.map(({ name, quantity }) => (
            <Box key={name} width="100%" minHeight="150px" display="flex" alignItems="center"
              justifyContent="space-between" bgcolor="#f0f0f0" padding={5}
            >
              <Typography variant="h3" color="#333" textAlign="center">{name.charAt(0).toUpperCase() + name.slice(1)}</Typography>
              <Typography variant="h3" color="#333" textAlign="center">{quantity}</Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => {
                  addItem(name)
                }}>Add</Button>
                <Button variant="contained" onClick={() => {
                  removeItem(name)
                }}>Remove </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
