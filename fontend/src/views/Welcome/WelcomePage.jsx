import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Card = ({ children, className }) => {
    return <div className={`bg-white shadow-lg rounded-lg ${className}`}>{children}</div>;
};

const CardContent = ({ children, className }) => {
    return <div className={`p-6 ${className}`}>{children}</div>;
};

const Button = ({ children, className, ...props }) => {
    return (
        <button
            className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

const WelcomePage = () => {
    const navigate = useNavigate();

    const handleButtonClick = () => {
        navigate('/admin');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="text-5xl font-bold text-white mb-4">Chào mừng bạn đến với ứng dụng!</h1>
                <p className="text-lg text-gray-100 mb-6">Khám phá những tính năng thú vị và tiện ích ngay bây giờ.</p>
                <Card className="w-96 mx-auto">
                    <CardContent>
                        <Button onClick={handleButtonClick}>Bắt đầu ngay</Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default WelcomePage;
