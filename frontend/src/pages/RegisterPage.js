import React, { useState } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    gender: '',
    email: '',
    password: '',
    phone_number: '',
    education: '',
    photo: '',
    skills: [],
    recovery_q1: { question: '', answer: '' },
    recovery_q2: { question: '', answer: '' }
  });
  const [skill, setSkill] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (e) => {
    setSkill(e.target.value);
  };

  const addSkill = () => {
    if (skill.trim() !== '' && !formData.skills.includes(skill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skill.trim()] });
      setSkill('');
    } else if (formData.skills.includes(skill.trim())) {
      setError('Duplicate skill. Please add a different skill.');
    }
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('recovery_q1')) {
      setFormData({ ...formData, recovery_q1: { ...formData.recovery_q1, [name.split('.')[1]]: value } });
    } else if (name.startsWith('recovery_q2')) {
      setFormData({ ...formData, recovery_q2: { ...formData.recovery_q2, [name.split('.')[1]]: value } });
    }
  };

  const handleNext = () => {
    if (step === 1 && formData.username && formData.first_name && formData.last_name && formData.gender && formData.email && formData.password && formData.phone_number && formData.education && formData.photo) {
      setStep(step + 1);
    } else if (step === 2) {
      setStep(step + 1);
    } else {
      setError('Please fill out all required fields');
    }
  };

  const handleRegister = async () => {
    if (formData.recovery_q1.question && formData.recovery_q1.answer && formData.recovery_q2.question && formData.recovery_q2.answer) {
      try {
        //console.log('Frontend data:', formData);
        const response = await axios.post('/register', formData);
        //console.log('Response from backend:', response.data);
        setSuccess('Registration successful! You can now log in.');
        setError('');
        setCurrentUser(response.data.user);
        navigate('/home');
      } catch (error) {
        console.error('Error from backend:', error.response ? error.response.data : error.message);
        setError('Error registering user');
        setSuccess('');
      }
    } else {
      setError('Please fill out all required fields');
    }
  };

  const questionOptions = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What was your favorite food as a child?",
    "What city were you born in?"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        {step === 1 && (
          <form>
            <div className="mb-4">
              <label className="block text-gray-700">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Gender</label>
              <input
                type="text"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Phone Number</label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700">Photo URL</label>
              <input
                type="text"
                name="photo"
                value={formData.photo}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                required
              />
            </div>
            <button type="button" onClick={handleNext} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              Next
            </button>
          </form>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Your Skills</h2>
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Skill</th>
                  <th className="py-2 px-4 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.skills.map((skill, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border-b">{skill}</td>
                    <td className="py-2 px-4 border-b"></td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 px-4 border-b">
                    <input
                      type="text"
                      value={skill}
                      onChange={handleSkillChange}
                      className="w-full p-2 border border-gray-300 rounded mt-1"
                      placeholder="Skill"
                    />
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button onClick={addSkill} className="bg-green-500 text-white px-3 py-1 rounded">
                      Add Skill
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button type="button" onClick={handleNext} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4">
              Next
            </button>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Recovery Questions</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Question 1</label>
              <select
                name="recovery_q1.question"
                value={formData.recovery_q1.question}
                onChange={handleQuestionChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              >
                <option value="" disabled>Select a question</option>
                {questionOptions.filter(q => q !== formData.recovery_q2.question).map((question, index) => (
                  <option key={index} value={question}>{question}</option>
                ))}
              </select>
              <input
                type="text"
                name="recovery_q1.answer"
                value={formData.recovery_q1.answer}
                onChange={handleQuestionChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                placeholder="Answer"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Question 2</label>
              <select
                name="recovery_q2.question"
                value={formData.recovery_q2.question}
                onChange={handleQuestionChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              >
                <option value="" disabled>Select a question</option>
                {questionOptions.filter(q => q !== formData.recovery_q1.question).map((question, index) => (
                  <option key={index} value={question}>{question}</option>
                ))}
              </select>
              <input
                type="text"
                name="recovery_q2.answer"
                value={formData.recovery_q2.answer}
                onChange={handleQuestionChange}
                className="w-full p-2 border border-gray-300 rounded mt-1"
                placeholder="Answer"
                required
              />
            </div>
            <button type="button" onClick={handleRegister} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 mt-4">
              Finish Registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
