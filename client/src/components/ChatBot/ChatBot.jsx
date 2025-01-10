// import React, { useState, useRef, useEffect } from 'react';
// import './ChatBot.css';
// import { FiSend, FiMessageSquare } from 'react-icons/fi';
// import { RiCustomerService2Fill } from 'react-icons/ri';

// const SHIPMENT_FORM_CONFIG = {
//   title: "Create New Shipment",
//   fields: [
//     {
//       name: "shipperCompanyName",
//       label: "Shipper Company Name",
//       type: "text",
//       required: true,
//       section: "Shipper Information"
//     },
//     {
//       name: "shipperContactPerson",
//       label: "Shipper Contact Person",
//       type: "text",
//       required: true,
//       section: "Shipper Information"
//     },
//     {
//       name: "shipperPhone",
//       label: "Shipper Phone Number",
//       type: "tel",
//       required: true,
//       section: "Shipper Information"
//     },
//     {
//       name: "shipperEmail",
//       label: "Shipper Email",
//       type: "email",
//       required: true,
//       section: "Shipper Information"
//     },
//     {
//       name: "shipperAddress",
//       label: "Shipper Address",
//       type: "textarea",
//       required: true,
//       section: "Shipper Information"
//     },
//     {
//       name: "consigneeCompanyName",
//       label: "Consignee Company Name",
//       type: "text",
//       required: true,
//       section: "Consignee Information"
//     },
//     {
//       name: "consigneeContactPerson",
//       label: "Consignee Contact Person",
//       type: "text",
//       required: true,
//       section: "Consignee Information"
//     },
//     {
//       name: "consigneePhone",
//       label: "Consignee Phone Number",
//       type: "tel",
//       required: true,
//       section: "Consignee Information"
//     },
//     {
//       name: "consigneeEmail",
//       label: "Consignee Email",
//       type: "email",
//       required: true,
//       section: "Consignee Information"
//     },
//     {
//       name: "consigneeAddress",
//       label: "Consignee Address",
//       type: "textarea",
//       required: true,
//       section: "Consignee Information"
//     },
//     {
//       name: "originCity",
//       label: "Origin City",
//       type: "text",
//       required: true,
//       section: "Origin"
//     },
//     {
//       name: "originState",
//       label: "Origin State/Province",
//       type: "text",
//       required: true,
//       section: "Origin"
//     },
//     {
//       name: "originCountry",
//       label: "Origin Country",
//       type: "text",
//       required: true,
//       section: "Origin"
//     },
//     {
//       name: "destinationCity",
//       label: "Destination City",
//       type: "text",
//       required: true,
//       section: "Destination"
//     },
//     {
//       name: "destinationState",
//       label: "Destination State/Province",
//       type: "text",
//       required: true,
//       section: "Destination"
//     },
//     {
//       name: "destinationCountry",
//       label: "Destination Country",
//       type: "text",
//       required: true,
//       section: "Destination"
//     },
//     {
//       name: "shipmentDate",
//       label: "Shipment Date",
//       type: "date",
//       required: true,
//       section: "Shipment Details"
//     },
//     {
//       name: "shipmentType",
//       label: "Shipment Type",
//       type: "select",
//       options: ["LTL", "FTL", "Parcel", "Air Freight", "Sea Freight"],
//       required: true,
//       section: "Shipment Details"
//     },
//     {
//       name: "numberOfPackages",
//       label: "Number of Packages",
//       type: "number",
//       required: true,
//       section: "Shipment Details"
//     },
//     {
//       name: "dimensions",
//       label: "Package Dimensions (LxWxH in cm)",
//       type: "text",
//       required: true,
//       placeholder: "e.g., 100x50x75",
//       section: "Shipment Details"
//     },
//     {
//       name: "weight",
//       label: "Weight (kg)",
//       type: "number",
//       required: true,
//       section: "Shipment Details"
//     },
//     {
//       name: "contentsDescription",
//       label: "Contents Description",
//       type: "textarea",
//       required: true,
//       placeholder: "Describe the goods being shipped",
//       section: "Shipment Details"
//     },
//     {
//       name: "trackingReference",
//       label: "Tracking Reference Number",
//       type: "text",
//       required: false,
//       placeholder: "Optional - will be generated if not provided",
//       section: "Additional Details"
//     },
//     {
//       name: "specialInstructions",
//       label: "Special Instructions",
//       type: "textarea",
//       required: false,
//       placeholder: "Any special handling requirements",
//       section: "Additional Details"
//     }
//   ]
// };

// const ChatBot = () => {
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);
//   const [formData, setFormData] = useState(null);
//   const messagesEndRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     // Remove form display logic since we're using schema-based responses
//     const lastMessage = messages[messages.length - 1];
//     if (lastMessage?.type === 'bot' && 
//         lastMessage.content.toLowerCase().includes('create') && 
//         lastMessage.content.toLowerCase().includes('shipment')) {
//       setFormData(null);
//     }
//   }, [messages]);

//   useEffect(() => {
//     const lastMessage = messages[messages.length - 1];
//     if (lastMessage?.type === 'bot') {
//       const formConfig = parseSchemaToFormFields(lastMessage.content);
//       if (formConfig) {
//         setFormData(formConfig);
//       }
//     }
//   }, [messages]);

//   const parseSchemaToFormFields = (message) => {
//     if (!message.includes('Based on our shipment schema')) return null;
    
//     const fields = [];
//     const lines = message.split('\n');
//     let currentSection = '';
    
//     lines.forEach(line => {
//       if (line.startsWith('*')) {
//         const [field, type, ...rest] = line.replace('* ', '').split(':').map(s => s.trim());
//         const options = rest.join(':').match(/\((Options: (.*?)\))/);
        
//         fields.push({
//           name: field,
//           label: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
//           type: type.toLowerCase() === 'string' ? 'text' : 
//                 type.toLowerCase() === 'number' ? 'number' : 
//                 type.toLowerCase() === 'date' ? 'date' : 
//                 type.toLowerCase() === 'array' ? 'textarea' : 'text',
//           required: true,
//           options: options ? options[2].split(', ') : null,
//           section: currentSection
//         });
//       }
//     });
    
//     return {
//       title: "Create New Shipment",
//       fields
//     };
//   };

//   const toggleChat = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleInputChange = (field, value) => {
//     if (!formData) return;
    
//     setFormData(prev => ({
//       ...prev,
//       values: {
//         ...(prev.values || {}),
//         [field]: value
//       }
//     }));
//   };

//   const handleFormSubmit = async () => {
//     if (!formData) return;

//     // Validate form
//     const missingFields = [];
//     formData.fields.forEach(field => {
//       if (field.required && !formData.values?.[field.name]) {
//         missingFields.push(field.label);
//       }
//     });

//     if (missingFields.length > 0) {
//       setMessages(prev => [...prev, {
//         type: 'bot',
//         content: `Please fill in all required fields: ${missingFields.join(', ')}`
//       }]);
//       return;
//     }

//     // Format the data for submission
//     const formattedMessage = Object.entries(formData.values || {})
//       .map(([field, value]) => `${field}: ${value}`)
//       .join('\n');

//     setMessages(prev => [...prev, {
//       type: 'user',
//       content: formattedMessage
//     }]);

//     setFormData(null);
//     handleSendMessage(formattedMessage);
//   };

//   const formatMessage = (text) => {
//     // Check if this is a tracking response
//     if (text.includes('Shipment ID:')) {
//       return formatShipmentDetails(text);
//     }
    
//     // Default text formatting
//     return formatDefaultText(text);
//   };

//   const formatDefaultText = (text) => {
//     const paragraphs = text.split('\n\n');
//     return (
//       <div className="text-response">
//         {paragraphs.map((para, index) => (
//           <p key={index}>{para}</p>
//         ))}
//       </div>
//     );
//   };

//   const formatShipmentDetails = (text) => {
//     try {
//       const [trackingInfo, ...additionalInfo] = text.split(/(?=The shipment)/);
//       const details = {};
//       const detailsPattern = /\*\*(.*?):\*\* (.*?)(?=\*\*|$)/g;
//       let match;
//       while ((match = detailsPattern.exec(trackingInfo))) {
//         details[match[1].trim()] = match[2].trim();
//       }

//       return (
//         <div className="tracking-response">
//           <div className="shipment-card">
//             <div className="shipment-header">
//               <h3>Shipment Tracking Details</h3>
//               <span className="shipment-status" data-status={details['Status']?.toLowerCase()}>
//                 {details['Status']}
//               </span>
//             </div>
            
//             <div className="shipment-info">
//               <div className="info-row">
//                 <div className="info-item">
//                   <label>Shipment ID</label>
//                   <value>{details['Shipment ID']}</value>
//                 </div>
//               </div>

//               <div className="route-info">
//                 <div className="location-item">
//                   <label>Origin</label>
//                   <value>{details['Origin']}</value>
//                 </div>
//                 <div className="route-arrow">→</div>
//                 <div className="location-item">
//                   <label>Destination</label>
//                   <value>{details['Destination']}</value>
//                 </div>
//               </div>

//               <div className="info-row">
//                 <div className="info-item">
//                   <label>Transport Mode</label>
//                   <value>{details['Mode of Transport']}</value>
//                 </div>
//                 <div className="info-item">
//                   <label>ETA</label>
//                   <value>{details['Estimated Time of Arrival (ETA)']}</value>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {additionalInfo.length > 0 && (
//             <div className="additional-info">
//               {additionalInfo.join(' ')}
//             </div>
//           )}
//         </div>
//       );
//     } catch (error) {
//       console.error('Error formatting shipment details:', error);
//       return text;
//     }
//   };

//   const handleSendMessage = async (customMessage = null) => {
//     const messageToSend = customMessage || inputMessage.trim();
//     if (!messageToSend) return;

//     setInputMessage('');
//     if (!customMessage) {
//       setMessages(prev => [...prev, { type: 'user', content: messageToSend }]);
//     }
//     setIsLoading(true);

//     try {
//       const response = await fetch('http://localhost:3000/api/chat/send', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ message: messageToSend }),
//       });

//       const data = await response.json();
      
//       // Don't add AI response if it's a predefined response and we already have the form showing
//       if (!data.skipAI || !formData) {
//         setMessages(prev => [...prev, { 
//           type: 'bot', 
//           content: data.response
//         }]);
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       setMessages(prev => [...prev, { 
//         type: 'bot', 
//         content: 'Sorry, I encountered an error. Please try again.' 
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   const renderFormFields = () => {
//     if (!formData) return null;

//     // Group fields by section
//     const sections = formData.fields.reduce((acc, field) => {
//       const section = field.section || 'Other';
//       if (!acc[section]) {
//         acc[section] = [];
//       }
//       acc[section].push(field);
//       return acc;
//     }, {});

//     return (
//       <div className="dynamic-form">
//         <h3 className="form-title">{formData.title}</h3>
//         {Object.entries(sections).map(([sectionName, fields]) => (
//           <div key={sectionName} className="form-section">
//             <h4 className="section-title">{sectionName}</h4>
//             <div className="form-fields">
//               {fields.map((field, index) => (
//                 <div key={index} className="form-field">
//                   <label>{field.label}{field.required && ' *'}</label>
//                   {field.type === 'select' ? (
//                     <select
//                       value={formData.values?.[field.name] || ''}
//                       onChange={(e) => handleInputChange(field.name, e.target.value)}
//                     >
//                       <option value="">Select {field.label}</option>
//                       {field.options.map((option, i) => (
//                         <option key={i} value={option}>{option}</option>
//                       ))}
//                     </select>
//                   ) : field.type === 'textarea' ? (
//                     <textarea
//                       value={formData.values?.[field.name] || ''}
//                       onChange={(e) => handleInputChange(field.name, e.target.value)}
//                       placeholder={field.placeholder}
//                     />
//                   ) : (
//                     <input
//                       type={field.type || 'text'}
//                       value={formData.values?.[field.name] || ''}
//                       onChange={(e) => handleInputChange(field.name, e.target.value)}
//                       placeholder={field.placeholder}
//                     />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         ))}
//         <button 
//           className="submit-button"
//           onClick={handleFormSubmit}
//         >
//           Submit
//         </button>
//       </div>
//     );
//   };

//   return (
//     <>
//       <button 
//         className="chatbot-trigger"
//         onClick={toggleChat}
//       >
//         <FiMessageSquare size={24} />
//       </button>

//       <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
//         <div className="chatbot-header" onClick={toggleChat}>
//           <div className="chatbot-header-title">
//             <RiCustomerService2Fill size={20} />
//             <span>Smart Cargo Assistant</span>
//           </div>
//         </div>

//         <div className="chatbot-messages">
//           {messages.map((message, index) => (
//             <div key={index} className={`message ${message.type}-message`}>
//               {message.type === 'bot' 
//                 ? formatMessage(message.content)
//                 : message.content
//               }
//             </div>
//           ))}
//           {formData && renderFormFields()}
//           {isLoading && (
//             <div className="typing-indicator">
//               <div className="typing-dot"></div>
//               <div className="typing-dot"></div>
//               <div className="typing-dot"></div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         <div className="chatbot-input">
//           <input
//             type="text"
//             value={inputMessage}
//             onChange={(e) => setInputMessage(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Type your message..."
//             disabled={isLoading}
//           />
//           <button 
//             className="send-button"
//             onClick={() => handleSendMessage()}
//             disabled={!inputMessage.trim() || isLoading}
//           >
//             <FiSend size={16} />
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ChatBot;


import React, { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { RiCustomerService2Fill } from 'react-icons/ri';

const SHIPMENT_FORM_CONFIG = {
  title: "Create New Shipment",
  fields: [
    {
      name: "shipperCompanyName",
      label: "Shipper Company Name",
      type: "text",
      required: true,
      section: "Shipper Information"
    },
    {
      name: "shipperContactPerson",
      label: "Shipper Contact Person",
      type: "text",
      required: true,
      section: "Shipper Information"
    },
    {
      name: "shipperPhone",
      label: "Shipper Phone Number",
      type: "tel",
      required: true,
      section: "Shipper Information"
    },
    {
      name: "shipperEmail",
      label: "Shipper Email",
      type: "email",
      required: true,
      section: "Shipper Information"
    },
    {
      name: "shipperAddress",
      label: "Shipper Address",
      type: "textarea",
      required: true,
      section: "Shipper Information"
    },
    {
      name: "consigneeCompanyName",
      label: "Consignee Company Name",
      type: "text",
      required: true,
      section: "Consignee Information"
    },
    {
      name: "consigneeContactPerson",
      label: "Consignee Contact Person",
      type: "text",
      required: true,
      section: "Consignee Information"
    },
    {
      name: "consigneePhone",
      label: "Consignee Phone Number",
      type: "tel",
      required: true,
      section: "Consignee Information"
    },
    {
      name: "consigneeEmail",
      label: "Consignee Email",
      type: "email",
      required: true,
      section: "Consignee Information"
    },
    {
      name: "consigneeAddress",
      label: "Consignee Address",
      type: "textarea",
      required: true,
      section: "Consignee Information"
    },
    {
      name: "originCity",
      label: "Origin City",
      type: "text",
      required: true,
      section: "Origin"
    },
    {
      name: "originState",
      label: "Origin State/Province",
      type: "text",
      required: true,
      section: "Origin"
    },
    {
      name: "originCountry",
      label: "Origin Country",
      type: "text",
      required: true,
      section: "Origin"
    },
    {
      name: "destinationCity",
      label: "Destination City",
      type: "text",
      required: true,
      section: "Destination"
    },
    {
      name: "destinationState",
      label: "Destination State/Province",
      type: "text",
      required: true,
      section: "Destination"
    },
    {
      name: "destinationCountry",
      label: "Destination Country",
      type: "text",
      required: true,
      section: "Destination"
    },
    {
      name: "shipmentDate",
      label: "Shipment Date",
      type: "date",
      required: true,
      section: "Shipment Details"
    },
    {
      name: "shipmentType",
      label: "Shipment Type",
      type: "select",
      options: ["LTL", "FTL", "Parcel", "Air Freight", "Sea Freight"],
      required: true,
      section: "Shipment Details"
    },
    {
      name: "numberOfPackages",
      label: "Number of Packages",
      type: "number",
      required: true,
      section: "Shipment Details"
    },
    {
      name: "dimensions",
      label: "Package Dimensions (LxWxH in cm)",
      type: "text",
      required: true,
      placeholder: "e.g., 100x50x75",
      section: "Shipment Details"
    },
    {
      name: "weight",
      label: "Weight (kg)",
      type: "number",
      required: true,
      section: "Shipment Details"
    },
    {
      name: "contentsDescription",
      label: "Contents Description",
      type: "textarea",
      required: true,
      placeholder: "Describe the goods being shipped",
      section: "Shipment Details"
    },
    {
      name: "trackingReference",
      label: "Tracking Reference Number",
      type: "text",
      required: false,
      placeholder: "Optional - will be generated if not provided",
      section: "Additional Details"
    },
    {
      name: "specialInstructions",
      label: "Special Instructions",
      type: "textarea",
      required: false,
      placeholder: "Any special handling requirements",
      section: "Additional Details"
    }
  ]
};

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Remove form display logic since we're using schema-based responses
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'bot' && 
        lastMessage.content.toLowerCase().includes('create') && 
        lastMessage.content.toLowerCase().includes('shipment')) {
      setFormData(null);
    }
  }, [messages]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.type === 'bot') {
      const formConfig = parseSchemaToFormFields(lastMessage.content);
      if (formConfig) {
        setFormData(formConfig);
      }
    }
  }, [messages]);

  const parseSchemaToFormFields = (message) => {
    if (!message.includes('Based on our shipment schema')) return null;
    
    const fields = [];
    const lines = message.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.startsWith('*')) {
        const [field, type, ...rest] = line.replace('* ', '').split(':').map(s => s.trim());
        const options = rest.join(':').match(/\((Options: (.*?)\))/);
        
        fields.push({
          name: field,
          label: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          type: type.toLowerCase() === 'string' ? 'text' : 
                type.toLowerCase() === 'number' ? 'number' : 
                type.toLowerCase() === 'date' ? 'date' : 
                type.toLowerCase() === 'array' ? 'textarea' : 'text',
          required: true,
          options: options ? options[2].split(', ') : null,
          section: currentSection
        });
      }
    });
    
    return {
      title: "Create New Shipment",
      fields
    };
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (field, value) => {
    if (!formData) return;
    
    setFormData(prev => ({
      ...prev,
      values: {
        ...(prev.values || {}),
        [field]: value
      }
    }));
  };

  const handleFormSubmit = async () => {
    if (!formData) return;

    // Validate form
    const missingFields = [];
    formData.fields.forEach(field => {
      if (field.required && !formData.values?.[field.name]) {
        missingFields.push(field.label);
      }
    });

    if (missingFields.length > 0) {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: `Please fill in all required fields: ${missingFields.join(', ')}`
      }]);
      return;
    }

    // Format the data for submission
    const formattedMessage = Object.entries(formData.values || {})
      .map(([field, value]) => `${field}: ${value}`)
      .join('\n');

    setMessages(prev => [...prev, {
      type: 'user',
      content: formattedMessage
    }]);

    setFormData(null);
    handleSendMessage(formattedMessage);
  };

  const formatMessage = (text) => {
    // Check if this is a tracking response
    if (text.includes('Shipment ID:')) {
      return formatShipmentDetails(text);
    }
    
    // Default text formatting
    return formatDefaultText(text);
  };

  const formatDefaultText = (text) => {
    const paragraphs = text.split('\n\n');
    return (
      <div className="text-response">
        {paragraphs.map((para, index) => (
          <p key={index}>{para}</p>
        ))}
      </div>
    );
  };

  const formatShipmentDetails = (text) => {
    try {
      const [trackingInfo, ...additionalInfo] = text.split(/(?=The shipment)/);
      const details = {};
      const detailsPattern = /\*\*(.*?):\*\* (.*?)(?=\*\*|$)/g;
      let match;
      while ((match = detailsPattern.exec(trackingInfo))) {
        details[match[1].trim()] = match[2].trim();
      }

      return (
        <div className="tracking-response">
          <div className="shipment-card">
            <div className="shipment-header">
              <h3>Shipment Tracking Details</h3>
              <span className="shipment-status" data-status={details['Status']?.toLowerCase()}>
                {details['Status']}
              </span>
            </div>
            
            <div className="shipment-info">
              <div className="info-row">
                <div className="info-item">
                  <label>Shipment ID</label>
                  <value>{details['Shipment ID']}</value>
                </div>
              </div>

              <div className="route-info">
                <div className="location-item">
                  <label>Origin</label>
                  <value>{details['Origin']}</value>
                </div>
                <div className="route-arrow">→</div>
                <div className="location-item">
                  <label>Destination</label>
                  <value>{details['Destination']}</value>
                </div>
              </div>

              <div className="info-row">
                <div className="info-item">
                  <label>Transport Mode</label>
                  <value>{details['Mode of Transport']}</value>
                </div>
                <div className="info-item">
                  <label>ETA</label>
                  <value>{details['Estimated Time of Arrival (ETA)']}</value>
                </div>
              </div>
            </div>
          </div>

          {additionalInfo.length > 0 && (
            <div className="additional-info">
              {additionalInfo.join(' ')}
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error('Error formatting shipment details:', error);
      return text;
    }
  };

  const handleSendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || inputMessage.trim();
    if (!messageToSend) return;

    setInputMessage('');
    if (!customMessage) {
      setMessages(prev => [...prev, { type: 'user', content: messageToSend }]);
    }
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await response.json();
      
      // Don't add AI response if it's a predefined response and we already have the form showing
      if (!data.skipAI || !formData) {
        setMessages(prev => [...prev, { 
          type: 'bot', 
          content: data.response
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFormFields = () => {
    if (!formData) return null;

    // Group fields by section
    const sections = formData.fields.reduce((acc, field) => {
      const section = field.section || 'Other';
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(field);
      return acc;
    }, {});

    return (
      <div className="dynamic-form">
        <h3 className="form-title">{formData.title}</h3>
        {Object.entries(sections).map(([sectionName, fields]) => (
          <div key={sectionName} className="form-section">
            <h4 className="section-title">{sectionName}</h4>
            <div className="form-fields">
              {fields.map((field, index) => (
                <div key={index} className="form-field">
                  <label>{field.label}{field.required && ' *'}</label>
                  {field.type === 'select' ? (
                    <select
                      value={formData.values?.[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map((option, i) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={formData.values?.[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData.values?.[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <button 
          className="submit-button"
          onClick={handleFormSubmit}
        >
          Submit
        </button>
      </div>
    );
  };

  return (
    <>
      <button 
        className="chatbot-trigger"
        onClick={toggleChat}
      >
        <FiMessageSquare size={24} />
      </button>

      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header" onClick={toggleChat}>
          <div className="chatbot-header-title">
            <RiCustomerService2Fill size={20} />
            <span>Smart Cargo Assistant</span>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}-message`}>
              {message.type === 'bot' 
                ? formatMessage(message.content)
                : message.content
              }
            </div>
          ))}
          {formData && renderFormFields()}
          {isLoading && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <button 
            className="send-button"
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatBot;