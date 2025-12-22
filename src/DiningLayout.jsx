import React from 'react';
import MaleDiningLayout from './MaleDiningLayout';
import FemaleDiningLayout from './FemaleDiningLayout';

export default function DiningLayout({ gender, ...props }) {
  const isFemale = (gender || '').toLowerCase().startsWith('f');
  return isFemale ? <FemaleDiningLayout {...props} /> : <MaleDiningLayout {...props} />;
}
