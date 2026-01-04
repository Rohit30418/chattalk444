import { useState } from 'react';
import { storage as firebaseStorage } from 'firebase/app';

const useUploadRoomBanner = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [bannerUrl, setBannerUrl] = useState(null);

  const uploadBanner = async (file) => {
    try {
      setUploading(true);
      const storageRef = firebaseStorage().ref();
      const bannerRef = storageRef.child(file.name);

      const uploadTask = bannerRef.put(file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setError(error.message);
          setUploading(false);
        },
        () => {
          uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
            setBannerUrl(downloadURL);
            setUploading(false);
          });
        }
      );
    } catch (error) {
      setError(error.message);
      setUploading(false);
    }
  };

  return { uploadBanner, uploading, uploadProgress, error, bannerUrl };
};

export default useUploadRoomBanner;
