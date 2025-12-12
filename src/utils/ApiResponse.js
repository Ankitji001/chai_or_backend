class ApiResponse{
    constructor(statusCode, data, messagae= "Success"){
        this.statusCode= statusCode;
        this.data= data;
        this.message= messagae; 
        this.success= statusCode < 400;
    }
}
export { ApiResponse }