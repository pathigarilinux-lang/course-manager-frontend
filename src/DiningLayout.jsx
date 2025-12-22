import React from 'react';
import MaleDiningLayout from './MaleDiningLayout';
import FemaleDiningLayout from './FemaleDiningLayout';

export default function DiningLayout({ gender, ...props }) {
  // STRICT LOGIC: 
  // If gender starts with 'F' or 'f' -> Load Female File
  // Otherwise -> Load Male File
  const isFemale = (gender || '').toLowerCase().startsWith('f');

  if (isFemale) {
    return <FemaleDiningLayout {...props} />;
  }
  
  return <MaleDiningLayout {...props} />;
}
