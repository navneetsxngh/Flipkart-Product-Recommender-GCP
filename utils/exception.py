import sys

class FlipkartException(Exception):
    def __init__(self, message:str, error_details:Exception=None):

        self.error_message = self.get_detailed_error_message(message, error_details)
        super().__init__(self.error_message)

    def get_detailed_error_message(self, message:str, error_details:Exception=None) -> str:
        exc_type, exc_value, exc_tb = sys.exc_info()
        
        # Fallback to error_details if no active exception context is found
        if not exc_tb and error_details:
            exc_tb = error_details.__traceback__
            exc_type = type(error_details)
            exc_value = error_details

        file_name = exc_tb.tb_frame.f_code.co_filename if exc_tb else "Unknown"
        line_number = exc_tb.tb_lineno if exc_tb else "Unknown"
        exc_type_name = exc_type.__name__ if exc_type else "Exception"
        exc_val_str = str(exc_value) if exc_value else str(message)

        exception_msg = (
            f"Exception message :[{message}],\n"
            f"file_name: [{file_name}],\n"
            f"line_number: [{line_number}],\n"
            f"error_message :[{exc_type_name} : {exc_val_str}]"
        )
        return exception_msg
    
    def __str__(self):
        return self.error_message