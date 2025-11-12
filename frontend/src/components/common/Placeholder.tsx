import React from 'react';

interface PlaceholderProps {
    title: string;
}

const Placeholder: React.FC<PlaceholderProps> = ({ title }) => {
    return (
        <div className="p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            <h1 className="text-3xl font-extrabold text-indigo-800 mb-4">{title}</h1>
            <p className="text-gray-600">
                This is a functional placeholder. You are successfully routed! 
                The next step is to replace this component with the actual API fetching and UI logic.
            </p>
        </div>
    );
};

export default Placeholder;
