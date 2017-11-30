(function(){// iffe start


  var socket = io.connect("http://localhost:3000");
  var trackTerm = $("#track-term");
  var tweetList = $("#tweet-list");
  // listen to  message event from server
  socket.on("tweet", (data)=>{
    appendProcessedImage(data);
  });

  function appendProcessedImage(data){
    var pics = data.tweet.entities.media;

    if(pics!= undefined){

      for(var i=0; i<pics.length;i++){

        var picsList =$("#tweet-list li");
        var src = data.fileUrl;
        var fileName = data.fileName;
        var tweetImg = $("<img id='img_"+fileName+"' style='height:300px; width:100%;' src="+src+">");
        var tweetRow = $("<li id="+fileName+"></li>");
        tweetRow.append(tweetImg);
        if (picsList.length<10){
          tweetList.append(tweetRow);
        }else{
         // get removable child
         var removAble = document.getElementById("tweet-list").firstChild;
         // get img src
         var removAbleImgId="img_"+removAble.getAttribute("id");
         // get src
         var removableSrc = document.getElementById(removAbleImgId).getAttribute('src');
         // remove first item in the list
         document.getElementById("tweet-list").removeChild(removAble);
         // append latest incoming item
         tweetList.append(tweetRow);
         // delete picture
         socket.emit("deleteProcessedPicture",{"src":removableSrc});
      }
    }
  }
}

  // update tracker term
  trackTerm.on("change", function(e){
    console.log($(this).val());
     tweetList.html("");
      socket.emit("updateTracker",{"trackerTerm":$(this).val()});
  });

})(); // iffe end
