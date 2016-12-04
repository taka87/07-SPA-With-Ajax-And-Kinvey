function startApp(){
    sessionStorage.clear();  

    showHideMenuLinks(); 

    showView('viewHome');


    $("#linkHome").click(showHomeView);
    $("#linkLogin").click(showLoginView);
    $("#linkRegister").click(showRegisterView);
    $("#linkListBooks").click(listBooks);
    $("#linkCreateBook").click(showCreateBookView);
    $("#linkLogout").click(logoutUser);

  
    $("#formLogin").submit(loginUser);
    $("#formRegister").submit(registerUser); 
    $("#buttonCreateBook").click(createBook);
    $("#buttonEditBook").click(editBook);

    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });


    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rkcLxcUr";
    const kinveyAppSecret =
        "e234a245b3864b2eb7ee41e19b8ca4e5";

    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };



    function showHideMenuLinks() {
        $("#linkHome").show();

        if (sessionStorage.getItem('authToken')) {
            $("#linkLogin").hide();
            $("#linkRegister").hide();
            $("#linkListBooks").show();
            $("#linkCreateBook").show();
            $("#linkLogout").show();
        }else{
            $("#linkLogin").show();
            $("#linkRegister").show();
            $("#linkListBooks").hide();
            $("#linkCreateBook").hide();
            $("#linkLogout").hide();
        }
    }



    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHomeView() {
        showView('viewHome');
    }

    function loginView(){
        showView('viewLogin');
    }

    function showLoginView(){
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }



    function listBooks(){

    }

    function showCreateBookView() {
        $('#formCreateBook').trigger('reset');
        showView('viewCreateBook');
    }

    function registerUser(event) {
        event.preventDefault();

        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + '/',
            data: userData,
            headers: kinveyAppAuthHeaders,
            success: registerUserSuccess,
            error: handleAjaxError
        });

        function registerUserSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('User registration successful.');
        }
    }
    
    function saveAuthInSession(userInfo){
        sessionStorage.setItem("username", userInfo.username);
        sessionStorage.setItem("authToken", userInfo._kmd.authtoken);
        sessionStorage.setItem("userId", userInfo._id);
        $('#loggedInUser').text("Welcome, " + userInfo.username + "!");
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function loginUser(event){
        event.preventDefault();
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + '/login',
            data: userData,
            headers: kinveyAppAuthHeaders,
            success: loginUserSuccess,
            error: handleAjaxError
        });
        function loginUserSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('Login successful.');
        }
    }

    function logoutUser(){
        sessionStorage.clear();
        $("#loggedInUser").text('');
        showView("viewHome");
        showHideMenuLinks();
        showInfo("Logout successfull");
    }

    function listBooks() {

        $('#books').empty();
        showView('viewBooks');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books",
            headers: getKinveyUserAuthHeaders(),
            success: loadBooksSuccess,
            error: handleAjaxError
        });


        function loadBooksSuccess(books) {
            let table = $(`
                <table>
                     <tr>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </table>`);



            for (let book of books) {
                let tr = $('<tr>');


                displayTableRow(tr, book);
                tr.appendTo(table);
            }
            $('#books').append(table);

        }
            function displayTableRow(tr, book){
                
                let links = [];
                if(book._acl.creator == sessionStorage.getItem("userId")){
                    let deleteLink =
                        $("<a href='#'>[Delete]</a>").click(function(){
                        deleteBookById(book._id);
                    });
                    let editLink = $("<a href='#'>[Edit]</a>").click(function(){
                        loadBookForEdit(book._id);
                    });;
                    links.push(deleteLink);
                    links.push(" ");
                    links.push(editLink);
                }



                tr.append(
                    $("<td>").text(book.title),
                    $("<td>").text(book.author),
                    $("<td>").text(book.description),
                    $("<td>").append(links) 
                );
            }
    }

    function deleteBookById(bookId){
        //alert("Delete " + bookId);
        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + bookId,
            headers: getKinveyUserAuthHeaders(),
            success: deleteBooksSuccess,
            error: handleAjaxError
        });

        function  deleteBooksSuccess(){
            showInfo("Book deleted.");
            listBooks();
        }
    }

    function getKinveyUserAuthHeaders(){
        return {
            "Authorization": "Kinvey " + sessionStorage.getItem("authToken")
        };
    }

    function createBook() {
        let bookData = {
            title: $('#formCreateBook input[name=title]').val(),
            author: $('#formCreateBook input[name=author]').val(),
            description: $('#formCreateBook textarea[name=descr]').val()
        };

        
        $.ajax({
            method: "Post",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books",
            headers: getKinveyUserAuthHeaders(),
            data: bookData,
            success: createBookSuccess,
            error: handleAjaxError
        });

        function createBookSuccess(){
            showInfo("Book created.");
            listBooks();
        }
    }

    function editBook() {
        let bookData = {
            title: $('#formEditBook input[name=title]').val(),
            author: $('#formEditBook input[name=author]').val(),
            description: $('#formEditBook textarea[name=descr]').val()
        };

        $.ajax({
            method: "PUT",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + $('#formEditBook input[name=id]').val(),
            headers: getKinveyUserAuthHeaders(),
            data: bookData,
            success: createBookSuccess,
            error: handleAjaxError
        });

        function createBookSuccess(){
            showInfo("Book edited.");
            listBooks();
        }
    }

    function loadBookForEdit(bookId) {
        $.ajax({
            method: "GET",
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/" + bookId,
            headers: getKinveyUserAuthHeaders(),
            success: loadBookForEditSuccess,
            error: handleAjaxError
        });

        function loadBookForEditSuccess(book){
            $('#formEditBook input[name=id]').val(book._id);
            $('#formEditBook input[name=title]').val(book.title);
            $('#formEditBook input[name=author]').val(book.author);
            $('#formEditBook textarea[name=descr]').val(book.description);
            showView('viewEditBook');

        }
    }
}