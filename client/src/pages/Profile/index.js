import { useSelector } from "react-redux";
import moment from 'moment';
import { useState, useEffect } from "react";
import { hideLoader, showLoader } from "../../redux/loaderSlice";
import { uploadProfilePic ,deleteUser} from '../../apiCalls/user';
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/usersSlice";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

function Profile({ socket }) {
    const { user } = useSelector(state => state.userReducer);
    const [image, setImage] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
  
    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This cannot be undone.")) {
            try {
                dispatch(showLoader());
                
                const response = await deleteUser(user._id);
                dispatch(hideLoader());
                
                if (response.success) {
                    toast.success(response.message);
                    // Logout the user after deletion
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            } catch (error) {
                dispatch(hideLoader());
                toast.error(error.message);
            }
        }
    };

    useEffect(() => {
        if (user?.ProfilePic) {
            setImage(user.ProfilePic);
        }
        // Listen for profile pic updates (in case it changes from another device)
        const handleProfilePicUpdate = (data) => {
            if (data.userId === user._id) {
                setImage(data.profilePic);
            }
        };

        if (socket) {
            socket.on('profile-pic-updated', handleProfilePicUpdate);
        }

        return () => {
            if (socket) {
                socket.off('profile-pic-updated', handleProfilePicUpdate);
            }
        };
    }, [user, socket]);

    function getinitials() {
        let f = user?.firstName.toUpperCase()[0];
        let l = user?.LastName.toUpperCase()[0];
        return f + l;
    }

    function getfullname() {
        let fname = user?.firstName?.toUpperCase() || "";
        let lname = user?.LastName?.toUpperCase() || "";
        return fname + " " + lname;
    }

    const onfileSelect = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader(file);
        // Check if file exists
        if (!file) {
            return;
        }

        // Validate file type
        const validTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please select a valid image (JPG, JPEG, PNG, or GIF)');
            return;
        }

        // Validate file size (2MB max)
        const maxSize = 1 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            toast.error('Image size should be less than 2MB');
            return;
        }
        reader.readAsDataURL(file);
        reader.onloadend = async () => { setImage(reader.result) };
    }

    const updateProfilePic = async () => {
        try {
            dispatch(showLoader());
            const response = await uploadProfilePic(image);
            dispatch(hideLoader());

            if (response.success) {
                toast.success(response.message);
                dispatch(setUser(response.data));
                // Emit profile pic update to socket
                if (socket) {
                    socket.emit('profile-pic-updated', {
                        userId: user._id,
                        profilePic: response.data.ProfilePic
                    });
                }
            } else {
                toast.error(response.message);
            }
        } catch (error) {
            toast.error(error.message);
            dispatch(hideLoader());
        }
    }

    return (
        <div className="profile-page-container" style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--text-color)' }}>
            <div className="profile-pic-container">
                {image && <img src={image}
                    alt="Profile Pic"
                    className="user-profile-pic-upload"
                    style={{ borderColor: 'var(--border-color)' }}
                />}
                {!image && <div className="user-default-profile-avatar" style={{ backgroundColor: 'var(--message-received-bg)', color: 'var(--message-received-text)', borderColor: 'var(--border-color)' }}>
                    {getinitials()}
                </div>}
            </div>

            <div className="profile-info-container">
                <div className="user-profile-name">
                    <h1 style={{ color: 'var(--text-color)' }}>{getfullname()}</h1>
                </div>
                <div>
                    <b>Email: </b>{user?.email}
                </div>
                <div>
                    <b>Account Created: </b>{moment(user?.createdAt).format('MMM DD, YYYY')}
                </div>
                <div className="select-profile-pic-container">
                    <input type="file"
                        onChange={onfileSelect}
                        style={{ color: 'var(--text-color)' }}
                    />
                    <button 
                        className="upload-image-btn" 
                        onClick={updateProfilePic}
                        style={{ 
                            backgroundColor: 'var(--searchlist-btn-bg)',
                            color: 'var(--searchlist-btn-text)'
                        }}
                    >
                        Upload
                    </button>
                    <button 
                        className="returnHome-btn" 
                        onClick={() => navigate('/')}
                        style={{ 
                            backgroundColor: 'var(--searchlist-btn-bg)',
                            color: 'var(--searchlist-btn-text)'
                        }}
                    >
                        Home
                    </button>
                </div>
            </div>
            <div className="profile-actions">
                <button 
                    className="delete-account-btn"
                    onClick={handleDeleteAccount}
                    style={{ 
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        marginTop: '20px'
                    }}
                >
                    Delete Account
                </button>
            </div>
        </div>
    );
}

export default Profile;