// https://preactjs.com/tutorial/09-error-handling/
import {Component} from 'preact'
import ErrorMsg from "@/components/shared/messageError";
import {useEffect, useState} from "react";

export default class GlobalErrorHandler extends Component {
    state = {errors: []}

    static getDerivedStateFromError(e) {
        return {
            errors: [
                e
            ]
        }
    }

    componentDidCatch(e) {
        this.setState({
            errors: [
                ...this.state.errors,
                e
            ]
        })
    }

    render({children}) {

        const [errors, setErrors] = useState([]);

        useEffect(() => {
            const handleError = (message, source, lineno, colno, error) => {
                // console.error('Global error handler:', message, source, lineno, colno, error);
                setErrors(prevErrors => [...prevErrors, error]);
                return true; // Prevents the default browser error handling.
            };

            window.onerror = handleError;

            return () => {
                window.onerror = null;
            };
        }, []);

        // // Log the errors whenever they update
        // useEffect(() => {
        //     console.log('Updated errors:', errors);
        // }, [errors]);


        if (this.state.errors && this.state.errors.length) {
            return <>
                {errors && errors.map((error, index) => (
                    <ErrorMsg key={index} error={error} borderRadius={0}/>
                ))}

                {children}
            </>

        }
        return children
    }
}
