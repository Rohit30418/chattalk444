import React, { useState } from 'react';
import { collection, addDoc, getDoc } from "firebase/firestore";
import { db } from '../services/firebase';

import { useParams } from 'react-router';

const useAddMessage = () => {
    const { id } = useParams();

    const addMessage = async (messageData) => {
        console.log(messageData);
        
        try {
            // Get the reference to the groupMessage collection
            const groupMessageRef = collection(db, `rooms`, id, 'groupMessage');

            // Add the message to the groupMessage collection
            const docRef = await addDoc(groupMessageRef, messageData);
            const docSnapshot = await getDoc(docRef);
            console.log("Message added successfully!");
            // Return the data of the newly added message
           return  docSnapshot.data();

           
        } catch (error) {
            console.error("Error adding message:", error.message);
        }
    };

    return addMessage;
};

export default useAddMessage;
