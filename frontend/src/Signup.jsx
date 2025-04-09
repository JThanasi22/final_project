import {jwtDecode} from 'jwt-decode';
import React, { useState } from 'react';
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBInput,
  MDBSpinner,
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalBody
} from 'mdb-react-ui-kit';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import LoginBanner from './assets/LoginBanner.png';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    birthday: null,
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    birthday: ''
  });
  const [message, setMessage] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(false);


  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) =>
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    if (id === 'email') {
      setErrors((prev) => ({
        ...prev,
        email: isValidEmail(value) ? '' : 'Invalid email format.'
      }));
    }

    if (id === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: isValidPassword(value)
            ? ''
            : 'Password must be at least 8 characters and include a number.'
      }));
    }

    if (id === 'confirmPassword') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: value === formData.password ? '' : 'Passwords do not match.'
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
        errors.email ||
        errors.password ||
        errors.confirmPassword ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
    ) {
      setMessage('Please fix validation errors before submitting.');
      return;
    }

    try {
      setLoading(true);
      setMessage('Signing you up...');

      const birthDay = formData.birthday;

      const normalizedBirthday = new Date(
          birthDay.getFullYear(),
          birthDay.getMonth(),
          birthDay.getDate()
      );
      const formattedBirthday = `${normalizedBirthday.getFullYear()}-${String(normalizedBirthday.getMonth() + 1).padStart(2, '0')}-${String(normalizedBirthday.getDate()).padStart(2, '0')}`;

      const today = new Date();
      const age = today.getFullYear() - normalizedBirthday.getFullYear();
      const m = today.getMonth() - normalizedBirthday.getMonth();
      const d = today.getDate() - normalizedBirthday.getDate();
      const is18Plus = age > 18 || (age === 18 && (m > 0 || (m === 0 && d >= 0)));

      if (!is18Plus) {
        setErrors((prev) => ({ ...prev, birthday: 'You must be at least 18 years old.' }));
        setMessage('Please fix validation errors before submitting.');
        setLoading(false);
        return;
      }


      const signupResponse = await axios.post('/api/users/signup', {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phone: formData.phone,
        birthday: formattedBirthday,
        password: formData.password
      });

      if (signupResponse.data.startsWith('User registered')) {
        setMessage('Logging you in...');

        const loginResponse = await axios.post('/api/users/login', {
          email: formData.email,
          password: formData.password
        });

        localStorage.setItem('token', loginResponse.data.token);
        localStorage.setItem('justSignedUp', 'true');

        const decoded = jwtDecode(loginResponse.data.token);
        const role = decoded.role;

        setTimeout(() => {
          if (role === 'a') {
            window.location.href = '/admin_dashboard';
          } else if (role === 'c') {
            window.location.href = '/dashboard';
          } else if (role === 'p'){
            window.location.href = '/photograph_dashboard';
          } else if (role === 's'){
            window.location.href = '/salesman_dashboard';
          } else if (role === 'e'){
            window.location.href = '/editor_dashboard';
          }
        }, 1500);
      } else {
        setMessage(signupResponse.data || 'Unexpected signup response');
      }
    } catch (error) {
      const errorMessage = error.response?.data || 'Error signing up!';

      if (errorMessage.includes('User already exists!')) {
        setModalMessage(errorMessage);
        setErrorModal(true);
      } else {
        setMessage(errorMessage);
      }
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  return (
      <>
        <MDBModal show={loading} setShow={() => {}} staticBackdrop tabIndex="-1">
          <MDBModalDialog centered>
            <MDBModalContent>
              <MDBModalBody className="text-center py-4">
                <MDBSpinner className="me-2" color="dark" />
                {message.includes('Logging you in') ? 'Logging you in...' : 'Signing you up...'}
              </MDBModalBody>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>

        <MDBModal show={errorModal} setShow={setErrorModal} tabIndex="-1">
          <MDBModalDialog centered>
            <MDBModalContent>
              <MDBModalBody className="text-center py-4">
                <p className="fw-bold text-danger mb-3">{modalMessage}</p>
                <MDBBtn color="dark" onClick={() => setErrorModal(false)}>
                  Close
                </MDBBtn>
              </MDBModalBody>
            </MDBModalContent>
          </MDBModalDialog>
        </MDBModal>

        <MDBContainer fluid className="signup-container">
          <MDBRow>
            <MDBCol sm="6" className="d-flex align-items-start justify-content-center">
              <div className="w-75 form-container">
                <div className="text-center mb-4">
                  <h2 className="fw-bold mb-3" style={{ fontSize: '2.7rem', color: '#161819' }}>
                    Your Studio, Your Vision
                  </h2>
                  <p className="lead" style={{ color: '#161819', fontSize: '1.1rem' }}>
                    Simplify Studio Management, Workflow and Clients.
                  </p>
                <h3 className="fw-bold mb-3 pb-3 custom-heading" style={{ letterSpacing: '4px' }}>Sign Up</h3>
                <form onSubmit={handleSubmit} className="w-100">
                  <MDBInput label="Name" id="name" type="text" size="lg" wrapperClass="mb-3" onChange={handleChange} value={formData.name} />
                  <MDBInput label="Surname" id="surname" type="text" size="lg" wrapperClass="mb-3" onChange={handleChange} value={formData.surname} />
                  <MDBInput label="Email" id="email" type="email" size="lg" wrapperClass="mb-2" onChange={handleChange} value={formData.email} />
                  {errors.email && <p className="text-danger small">{errors.email}</p>}

                  <MDBInput label="Phone Number" id="phone" type="tel" size="lg" wrapperClass="mb-3" onChange={handleChange} value={formData.phone} />

                  <MDBInput label="Password" id="password" type="password" size="lg" wrapperClass="mb-2" onChange={handleChange} value={formData.password} />
                  {errors.password && <p className="text-danger small">{errors.password}</p>}

                  <MDBInput label="Confirm Password" id="confirmPassword" type="password" size="lg" wrapperClass="mb-2" onChange={handleChange} value={formData.confirmPassword} />
                  {errors.confirmPassword && <p className="text-danger small">{errors.confirmPassword}</p>}

                  <div className="d-flex align-items-center mb-3">
                    <label htmlFor="birthday" className="form-label me-3 mb-0" style={{ minWidth: '80px' }}>
                      Birthday
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <DatePicker
                          id="birthday"
                          selected={formData.birthday}
                          onChange={(date) => {
                            setFormData({ ...formData, birthday: date });

                            const today = new Date();
                            const age = today.getFullYear() - date.getFullYear();
                            const m = today.getMonth() - date.getMonth();
                            const is18Plus = age > 18 || (age === 18 && m >= 0);

                            setErrors((prev) => ({
                              ...prev,
                              birthday: is18Plus ? '' : 'You must be at least 18 years old.'
                            }));
                          }}
                          maxDate={new Date()}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          dateFormat="yyyy-MM-dd"
                          customInput={
                            <button
                                type="button"
                                className="btn btn-outline-dark"
                                style={{
                                  borderRadius: '50%',
                                  width: '42px',
                                  height: '42px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                            >
                              <FaCalendarAlt />
                            </button>
                          }
                      />
                      {formData.birthday && (
                          <span className="text-dark">{formData.birthday.toLocaleDateString('en-CA')}</span>
                      )}
                      {errors.birthday && (
                          <div className="text-danger small mb-3">{errors.birthday}</div>
                      )}
                    </div>
                  </div>



                  <MDBBtn type="submit" className="mb-4 w-100" color="dark" size="lg" disabled={loading}>
                    {loading ? 'Processing...' : 'Sign up'}
                  </MDBBtn>
                </form>

                {message && !errorModal && (
                    <p className={`mt-2 text-center ${message.includes('success') ? 'text-success' : 'text-danger'}`}>
                      {message}
                    </p>
                )}

                <p className="text-center mt-3">
                  Already have an account? <a href="/" className="link-info">Log in</a>
                </p>
                </div>
              </div>
            </MDBCol>

            <MDBCol sm="6" className="d-none d-sm-block px-0">
              <img
                  src={LoginBanner}
                  alt="Login visual"
                  className="w-100"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            </MDBCol>
          </MDBRow>
        </MDBContainer>
      </>
  );
}

export default Signup;
