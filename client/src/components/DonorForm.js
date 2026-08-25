import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Grid,
  AppBar,
  Toolbar,
  Stack,
  IconButton,
  Divider,
  ThemeProvider,
  createTheme,
  Snackbar
} from '@mui/material';
import {
  Favorite,
  Search,
  ArrowBack,
  LocalHospital,
  BloodtypeOutlined,
  Phone
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../config/api';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const theme = createTheme({
  palette: {
    primary: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    secondary: {
      main: '#f5f5f5',
      light: '#ffffff',
      dark: '#e0e0e0',
    }
  }
});

function DonorForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    bloodGroup: '',
    email: '',
    phoneNumber: '',
    lastDonatedDate: '',
    facebookProfileUrl: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phoneNumber') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 11);
      setFormData({ ...formData, [name]: numbersOnly });
      return;
    }

    // Special handling for date
    if (name === 'lastDonatedDate') {
      try {
        // Ensure the date is valid
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setFormData({ ...formData, [name]: value });
        }
      } catch (err) {
        console.error('Invalid date:', err);
      }
      return;
    }

    // Special handling for Facebook URL
    if (name === 'facebookProfileUrl' && value) {
      let formattedUrl = value;
      if (!value.startsWith('http')) {
        formattedUrl = `https://www.facebook.com/${value}`;
      }
      setFormData({ ...formData, [name]: formattedUrl });
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Client-side validation
      if (!formData.name || !formData.location || !formData.bloodGroup || !formData.email) {
        throw new Error('Please fill in all required fields');
      }

      if (!formData.phoneNumber && !formData.facebookProfileUrl) {
        throw new Error('Please provide either Phone Number or Facebook Profile URL');
      }

      if (!formData.email.endsWith('@gmail.com')) {
        throw new Error('Please use a valid Gmail address');
      }

      if (formData.phoneNumber && !/^\d{11}$/.test(formData.phoneNumber)) {
        throw new Error('Phone number must be exactly 11 digits');
      }

      // baseURL already includes /api/donors
      await api.post('/', formData);

      setSnackbarMessage('Registration successful! Redirecting to donor list...');
      setSnackbarOpen(true);
      
      // Clear form data
      setFormData({
        name: '',
        location: '',
        bloodGroup: '',
        email: '',
        phoneNumber: '',
        lastDonatedDate: '',
        facebookProfileUrl: ''
      });

      // Navigate immediately to the donor list
      navigate('/');

    } catch (err) {
      let errorMessage = '';

      if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || 'Server error. Please try again.';
      } else if (err.request) {
        // Request was made but no response
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        // Client-side error
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindDonors = () => {
    navigate('/');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        pb: 6,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(180deg, #d32f2f 0%, #ef5350 100%)',
          zIndex: 0,
        }
      }}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Container maxWidth="lg">
            <Toolbar sx={{ px: { xs: 0 } }}>
              <IconButton
                edge="start"
                color="inherit"
                onClick={() => navigate('/')}
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalHospital />
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  BloodinNeed
                </Typography>
              </Stack>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                color="inherit"
                startIcon={<Search />}
                onClick={handleFindDonors}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  backdropFilter: 'blur(10px)',
                }}
              >
                Find Donors
              </Button>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', color: 'white', mb: 6, mt: 4 }}>
            <Typography variant="h3" gutterBottom>
              Become a Blood Donor
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9 }}>
              Your donation can save lives
            </Typography>
          </Box>

          <Paper 
            elevation={0}
            sx={{ 
              p: { xs: 3, md: 6 },
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              background: '#fff',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(239,83,80,0.1) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 0,
              }
            }}
          >
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BloodtypeOutlined color="primary" />
                    Personal Information
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    error={!!error}
                    helperText={error}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Blood Group"
                    name="bloodGroup"
                    select
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
                    error={!!error}
                    helperText={error}
                  >
                    {bloodGroups.map((group) => (
                      <MenuItem key={group} value={group}>
                        {group}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    error={!!error}
                    helperText={error}
                    placeholder="Enter your city or area"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h5" gutterBottom sx={{ my: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone color="primary" />
                    Contact Information
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    error={!!error}
                    helperText={error || 'Enter 11 digit number (optional if Facebook provided)'}
                    placeholder="01XXXXXXXXX"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    error={!!error}
                    helperText={error || 'Enter your Gmail address'}
                    placeholder="example@gmail.com"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Donated Date"
                    type="date"
                    name="lastDonatedDate"
                    value={formData.lastDonatedDate}
                    onChange={handleChange}
                    error={!!error}
                    helperText={error || 'When did you last donate blood? (Optional)'}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      max: format(new Date(), 'yyyy-MM-dd')
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Facebook Profile"
                    name="facebookProfileUrl"
                    value={formData.facebookProfileUrl}
                    onChange={handleChange}
                    error={!!error}
                    helperText={error || 'Enter complete profile URL (optional if Phone provided)'}
                    placeholder="https://www.facebook.com/username"
                    sx={{
                      '& .MuiFormHelperText-root': {
                        color: error ? 'error.main' : 'text.secondary',
                        marginLeft: 0,
                        marginTop: 1
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<Favorite />}
                      sx={{
                        minWidth: 250,
                        py: 1.5,
                        fontSize: '1.1rem',
                      }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registering...' : '❤️ Register as Donor'}
                    </Button>
                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                      By registering, you agree to our terms and conditions
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{
            sx: { 
              bgcolor: snackbarMessage.includes('Registration successful') ? 'success.main' : 'error.main',
              color: '#fff',
              '& .MuiSnackbarContent-message': {
                fontSize: '1rem',
                fontWeight: 500
              }
            }
          }}
        />
      </Box>
    </ThemeProvider>
  );
}

export default DonorForm;
