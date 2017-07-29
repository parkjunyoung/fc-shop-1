module.exports = function(io) {
    io.on('connection', function(socket){ 
        socket.on('client message', function(data){
            io.emit('server message', data.message);
        });
    });
};