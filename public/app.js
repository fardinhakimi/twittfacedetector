(function () {

  var socket = io();

  socket.connect('http://localhost:3000')

  var trackTerm = $("#track-term");
  var tweetList = $("#tweet-list");

  function appendImage(tweetRow) {
    tweetList.append(tweetRow);
  }

  function deleteProcessedImage() {
    var removAble = document.getElementById("tweet-list").firstChild;
    var removAbleImgId = "img_" + removAble.getAttribute("id");
    document.getElementById("tweet-list").removeChild(removAble);
    var removableSrc = document.getElementById(removAbleImgId).getAttribute('src');
    socket.emit("deleteProcessedPicture", { "src": removableSrc });
  }

  function appendProcessedImage(data) {

    if (data.fileUrl && data.fileName) {

      var picsList = $("#tweet-list li");
      var src = data.fileUrl;
      var fileName = data.fileName;
      var tweetImg = $("<img id='img_" + fileName + "' style='height:300px; width:100%;' src=" + src + ">");
      var tweetRow = $("<li id=" + fileName + "></li>");
      tweetRow.append(tweetImg);

      if (picsList.length < 10) {
        appendImage(tweetRow);
      } else {
        appendImage(tweetRow);
        deleteProcessedImage();
      }
    }
  }

  socket.on("tweet", (data) => {
    appendProcessedImage(data);
  });

  trackTerm.on("change", function (e) {
    tweetList.html("");
    socket.emit("updateTracker", { "trackerTerm": $(this).val() });
  });


})();
