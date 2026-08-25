import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  MenuItem,
  TextField,
  Grid,
  ThemeProvider,
  createTheme,
  Chip,
  Stack,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add,
  Phone,
  LocationOn,
  CalendarToday,
  Facebook,
  LocalHospital,
  BloodtypeOutlined,
} from '@mui/icons-material';
import api from '../config/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#fff',
    },
    secondary: {
      main: '#f5f5f5',
      light: '#ffffff',
      dark: '#e0e0e0',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 6px 30px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
          },
        },
      },
    },
  },
});

const bloodGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function DonorList() {
  const navigate = useNavigate();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('All');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/', {
        params: selectedBloodGroup === 'All' ? undefined : { bloodGroup: selectedBloodGroup }
      });

      setDonors(response.data);
    } catch (err) {
      setError('Failed to load donors');
      setSnackbarMessage('Failed to load donors');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  }, [selectedBloodGroup]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleBloodGroupChange = (event) => {
    setSelectedBloodGroup(event.target.value);
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
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalHospital />
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  BloodInNeed
                </Typography>
              </Stack>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                color="secondary"
                startIcon={<Add />}
                onClick={handleRegisterClick}
                sx={{ 
                  color: 'primary.main',
                  bgcolor: 'white',
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s'
                  }
                }}
              >
                Register as Donor
              </Button>
            </Toolbar>
          </Container>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, position: 'relative', zIndex: 1 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography 
                      variant="h5" 
                      component="h1" 
                      sx={{ 
                        color: 'white', 
                        mb: 1,
                        fontWeight: 600,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      Find Blood Donors
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'white', 
                        opacity: 0.95,
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      Connect with blood donors in your area
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Blood Group"
                      value={selectedBloodGroup}
                      onChange={handleBloodGroupChange}
                      variant="outlined"
                      InputLabelProps={{
                        sx: {
                          color: 'primary.main',
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        },
                      }}
                      sx={{ 
                        bgcolor: 'white',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          color: 'primary.main',
                          '& fieldset': {
                            borderColor: 'transparent',
                          },
                          '&:hover fieldset': {
                            borderColor: 'primary.light',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiSelect-select': {
                          color: 'primary.main',
                        },
                        '& .MuiMenuItem-root': {
                          color: 'primary.main',
                        }
                      }}
                    >
                      {bloodGroups.map((group) => (
                        <MenuItem 
                          key={group} 
                          value={group}
                          sx={{
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.light',
                              color: 'white',
                            },
                            '&.Mui-selected': {
                              bgcolor: 'primary.main',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            },
                          }}
                        >
                          {group}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {loading ? (
              <Grid item xs={12}>
                <Typography>Loading donors...</Typography>
              </Grid>
            ) : error ? (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            ) : donors.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6">No donors found</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Be the first to register as a donor!
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Grid container spacing={3}>
                  {donors.map((donor) => (
                    <Grid item xs={12} sm={6} md={4} key={donor._id}>
                      <Card>
                        <CardContent>
                          <Stack spacing={2}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="h6" component="h2">
                                {donor.name}
                              </Typography>
                              <Chip
                                label={donor.bloodGroup}
                                color="primary"
                                size="small"
                                icon={<BloodtypeOutlined />}
                              />
                            </Stack>
                            
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <LocationOn color="action" fontSize="small" />
                                <Typography variant="body2">{donor.location}</Typography>
                              </Stack>
                              
                              {donor.phoneNumber && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Phone color="action" fontSize="small" />
                                  <Typography variant="body2">{donor.phoneNumber}</Typography>
                                </Stack>
                              )}
                              
                              {donor.lastDonatedDate && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <CalendarToday color="action" fontSize="small" />
                                  <Typography variant="body2">
                                    Last donated: {format(new Date(donor.lastDonatedDate), 'PP')}
                                  </Typography>
                                </Stack>
                              )}
                              
                              {donor.facebookProfileUrl && (
                                <Button
                                  variant="outlined"
                                  startIcon={<Facebook />}
                                  href={donor.facebookProfileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  fullWidth
                                >
                                  Facebook Profile
                                </Button>
                              )}
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default DonorList;
