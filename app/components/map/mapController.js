'use strict';


angular.module('acjim.map', ['ngRoute'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/map', {
            templateUrl: 'app/components/map/mapView.html',
            controller: 'mapCtrl'
        });
    }])


    .controller('mapCtrl', ['$scope', '$http', 'mapService', function($scope, $httd, mapService) {
        $scope.improveFactor=100;
        var addingnodes =0;
        var comparingMaps=0;
        var nodes = null;
        var edges = null;
        var options = null;
        var container =null;
        var nodes = [];
        var nodes2 =[];
        var edges = [];
        var network ;
        var data2;
        var data3;
        var data;
        var reader;
        var DIR = 'img/refresh-cl/';
        var LENGTH_MAIN = 100;
        var LENGTH_SUB = 3;
        var toDelete=null;
        function checkFileAPI() {
            if (window.File && window.FileReader && window.FileList && window.Blob) {
                reader = new FileReader();
                return true;
            } else {
                alert('The File APIs are not fully supported by your browser. Fallback required.');
                return false;
            }
        }
        function displayContents(txt){
            var el = document.getElementById('main');
            //alert(txt.length);
            var obj = JSON.parse(txt);
            document.getElementById('writingpanel').innerHTML = txt; //display output in DOM
            updateFromFile(obj);
        }

        function readText(filePath) {
            checkFileAPI();
            var output = ""; //placeholder for text output
            if(filePath.files && filePath.files[0]) {
                reader.onload = function (e) {
                    output = e.target.result;
                    displayContents(output);
                };//end onload()
                reader.readAsText(filePath.files[0]);
            }//end if html5 filelist support
            else if(ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
                try {
                    reader = new ActiveXObject("Scripting.FileSystemObject");
                    var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
                    output = file.ReadAll(); //text contents of file
                    file.Close(); //close file "input stream"
                    displayContents(output);

                } catch (e) {
                    if (e.number == -2146827859) {
                        alert('Unable to access local files due to browser security settings. ' +
                        'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' +
                        'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"');
                    }
                }
            }
            else { //this is where you could fallback to Java Applet, Flash or similar
                return false;
            }
            return true;
        }
        function drawNewMap(container,data, options) {
            var network2 = new vis.Network(container, data, options);
            network2.on('doubleClick', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert("hello");
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                //alert("hello");
            });
            network2.on('select', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                //console.log(params);
                //alert("select");
                toDelete=params;
                //
            });
            network2.on('dragEnd', function(params){
                var id=-1;
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                alert("dragend");
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                console.log(params);
                console.log(nodes);
                if (params.nodes.length>0){
                    // we should get the position first
                    // To do get the array position of the element to be changed
                    for (var i=0; i<params.nodes.length; i++){
                        id= getPosition(params.nodes[i], nodes);
                        nodes[id].x=params.pointer.canvas.x;
                        nodes[id].y=params.pointer.canvas.y;
                    }
                    //alert(params.pointer.canvas.x);
                    //alert(nodes[id].x);
                }
                // save the node's new coordinates
                //
            });
            // Get the Position of an element in the array set of the nodeSet
            function getPosition(id,nodeSet){
                for(var i=0; i< nodeSet.length; i++){
                    if (id== nodeSet[i].id){
                        return i;
                    }
                }
                return -1;
            }

            network2.on('click', function(params) {
                // document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert(document.getElementById('selection').innerHTML);
                document.getElementById('writingpanel').innerHTML= 'We Selected Virus ' + params.nodes+" with X value"+params.pointer.canvas.x+" and Y value"+params.pointer.canvas.y;
                //console.log(params);
                //alert("click");
            });
        }
        function updateFromFile(dataFromFile) {
            // assign the dataFromFile to the data
            nodes = [];
            edges= [];
            var x=0;
            var y=0;
            for (var i=0; i<dataFromFile.layout.length; i++){
                x=dataFromFile.layout[i][0]*improveFactor;
                y=dataFromFile.layout[i][1]*improveFactor;
                nodes.push({ id: i, title: "S"+i, label: "S"+i,size: 7,color: 'red', image: DIR + 'virus1.png', shape: 'dot',x: x, y:y});
                nodes2.push({ id: i, title: "S"+i, label: "S"+i,size: 7,color: 'red', image: DIR + 'virus1.png', shape: 'dot',x: x, y:y});

            }
            container = document.getElementById('mynetwork');
            container.innerHTML="";
            data = {
                nodes: nodes,
                edges: edges
            };data3 = {
                nodes: nodes2,
                edges: edges
            };
            var options = {
                physics: false,
                interaction:{
                    hover: true,
                    multiselect: true
                },
                edges: {
                    smooth:true
                }}
            network = new vis.Network(container, data, options);

            // Adding event listeners
            network.on('select', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                //console.log(params);
                toDelete=params;
                //
            });
            network.on('dragEnd', function(params){
                var id=-1;
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                alert("dragend");
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                console.log(params);
                console.log(nodes);
                if (params.nodes.length>0){
                    // we should get the position first
                    // To do get the array position of the element to be changed
                    for (var i=0; i<params.nodes.length; i++){
                        id= getPosition(params.nodes[i], nodes);
                        nodes[id].x=params.pointer.canvas.x;
                        nodes[id].y=params.pointer.canvas.y;
                    }
                }
                // save the node's new coordinates
                //
            });
            function getPosition(id,nodeSet){
                for(var i=0; i< nodeSet.length; i++){
                    if (id== nodeSet[i].id){
                        return i;
                    }
                }
                return -1;
            }
            network.on('click', function(params) {
                // document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert(document.getElementById('selection').innerHTML);
                document.getElementById('writingpanel').innerHTML= 'We Selected Virus ' + params.nodes+" with X value"+params.pointer.DOM.x+" and Y value"+params.pointer.DOM.y;
                //console.log(params);
            });
            network.on('doubleClick', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert("hello");
                if (addingnodes!=0){
                    // Adding the node in here, before then wrapping up everything
                    nodes.push({ title: "Vir", label: 'Virus Added ',shadow: true,size: 2, image: DIR + 'virus4.png', shape: 'image',x: params.pointer.canvas.x, y: params.pointer.canvas.y,physics:false});
                    //console.log(params.pointer.DOM.x);
                    //console.log(params.pointer.DOM.y);
                    update(container,data, options);
                    //console.log(params);
                }
                addingnodes=0;
            });
        }
        function update(container,data, options) {
            network = new vis.Network(container, data, options);
            network.on('select', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                //console.log(params);
                toDelete=params;
                //
            });
            network.on('click', function(params) {
                // document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert(document.getElementById('selection').innerHTML);
                document.getElementById('writingpanel').innerHTML= 'We Selected Virus ' + params.nodes+" with X value"+params.pointer.DOM.x+" and Y value"+params.pointer.DOM.y;
                //console.log(params);
            });
            network.on('doubleClick', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert("hello");
                if (addingnodes!=0){
                    // Adding the node in here, before then wrapping up everything
                    nodes.push({ title: "Vir", label: 'Virus Added ',shadow: true,size: 2, image: DIR + 'virus4.png', shape: 'image',x: params.pointer.canvas.x, y: params.pointer.canvas.y,physics:false});
                    //console.log(params.pointer.DOM.x);
                    //console.log(params.pointer.DOM.y);
                    update(container,data, options);
                    //console.log(params);
                }
                addingnodes=0;
            });

        }

        // Called when the Visualization API is loaded.
        function draw() {
            // Create a data table with nodes.
            nodes.push({ id: 1, title: "Virus Koko", label: 'Virus koko',size: 7, image: DIR + 'virus1.png', shape: 'image',x: 100, y:10});
            nodes.push({id: 2, label: 'Virus 2',title: "Virus 2 ",size: 7, image: DIR + 'Virus6.png', shape: 'image',x: 50, y:0});
            //nodes.push({id: 3, label: 'Virus 3', image: DIR + 'Virus7.png', shape: 'image',x: 500, y:60});
            //edges.push({from: 1, to: 3, length: LENGTH_MAIN});
            /* for (var i = 4; i <= 7; i++) {
             nodes.push({id: i, label: 'Computer', image: DIR + 'Hardware-My-Computer-3-icon.png', shape: 'image',x: 10, y:10});
             edges.push({from: 2, to: i, length: LENGTH_SUB});
             }*/

            nodes.push({id: 4, label: 'Virus 4', color: 'red',size: 3, shape: 'dot', y:30});
            //edges.push({from: 2, to: 101, length: LENGTH_SUB});

            nodes.push({id: 5, label: 'Virus 5', image: DIR + 'virus3.png',size:5, shape: 'image',x: 50, y:30});
            //edges.push({id: 6, from: 4, to: 10, length: LENGTH_SUB});
            nodes.push({id: 7, label: 'Virus 7.1', size: 5,image: DIR + 'virus4.png', shape: 'image',x: 150, y:200});
            nodes.push({id: 77, title: "Virus 7.2",label: '', size: 5,image: DIR + 'virus4.png', shape: 'image',x: 155, y:200});
            nodes.push({id: 78, title: "Virus 7.3",label: '', size: 5,image: DIR + 'virus4.png', shape: 'image',x: 145, y:200});
            nodes.push({ id: 999, title: "", label: '',size: 5, image: DIR + 'none.png', shape: 'image',x: 100, y:230});
            //edges.push({from: 7, to: 999,color: 'red',smooth: false});
            nodes.push({id: 16, label: '', title: "Virus 11",image: DIR + 'virus5.png',size: 5, color: "blue",shape: 'image',x: 350, y:230});
            nodes.push({id: 20, label: '', title: "Virus 12",image: DIR + 'none.png',size: 5, color: "blue",shape: 'image',x: 400, y:230});
            // edges.push({from: 17, to: 16,smooth: false});nodes.push({id: 17, label: '', title: "Virus 12",image: DIR + 'none.png',size: 5, color: "blue",shape: 'image',x: 310, y:230});
            // Blobs doing
            nodes.push({id: 88, label: '', title: "Trying a Blob",image: DIR + 'none.png',size: 5, color: "blue",shape: 'image',x: 310, y:230});
            //edges.push({from: 88, to: 88,length:10});

            //edges.push({from: 1, to: 103, length: LENGTH_SUB});
            nodes.push({id: 10, label: 'virus 10', image: DIR + 'virus5.png',size: 5, shape: 'image',x: 400, y:260});
            nodes.push({id: 11, label: '',title: "Virus 10", image: DIR + 'virus5.png', size: 5,shape: 'image',x: 410, y:280});
            nodes.push({id: 12, label: '',title: "Virus 10", image: DIR + 'virus5.png',size: 5, shape: 'image',x: 420, y:280});
            nodes.push({id: 13, label: '',title: "Virus 10", image: DIR + 'virus5.png',size: 5, shape: 'image',x: 430, y:280});
            nodes.push({id: 14, label: '',title: "Virus 10", image: DIR + 'virus5.png',size: 5, shape: 'image',x: 460, y:280});
            nodes.push({id: 15, label: '', title: "Virus 10",image: DIR + 'virus5.png', size: 5,shape: 'image',x: 470, y:280});

            // edges.push({from: 1, to: 104, length: LENGTH_SUB});
            /* for (var i = 200; i <= 201; i++ ) {
             nodes.push({id: i, label: 'Smartphone', image: DIR + 'Hardware-My-PDA-02-icon.png', shape: 'image',x: 10, y:10});
             edges.push({from: 3, to: i, length: LENGTH_SUB});
             }*/

            // create a network
            container = document.getElementById('mynetwork');
            container.innerHTML="";
            data = {
                nodes: nodes,
                edges: edges
            };
            var options = {
                physics: false,
                interaction:{
                    hover: true,
                    multiselect: true
                },
                edges: {
                    smooth:true
                }
            }
            network = new vis.Network(container, data, options);
            // The select event listener offers more options compared to the click one
            network.on('select', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert("hello");
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                //console.log(params);
                toDelete=params;
                //
            });

            var head = document.getElementById("header2");
            var deleteN = document.getElementById("delete");
            var newMap = document.getElementById("newmap");
            var compareMaps = document.getElementById("compare");
            var addNode = document.getElementById("add");
            var addaNode = function(){
                alert("Double click on the location you want to place your element");
                addingnodes= 1;
            }
            var compareTwoMaps = function (){
                if(comparingMaps==0){
                    alert("There Should Be Two Maps to Compare");
                }
                else{
                    alert("Comparing Maps to Start");
                    compare(data,data3);
                    //comparing data in the two formats.
                }

            }
            var compare= function (data, data2){
                //console.log(data);
                var id=-1;
                var node = [];
                var edge= [];
                alert(data.nodes.length);
                console.log(data.nodes);
                //console.log(data2.nodes);
                for (var i=0; i< data.nodes.length; i++){
                    // Get an Id of a specific node in set 2, then draw both
                    id= getPosition(data.nodes[i].id, data2.nodes);
                    // one for one

                    node.push({id: i, label: 'Virus:'+i,title: 'Virus:'+i,size: 7, image: DIR + 'Virus6.png',color: 'red',shape: 'dot',x: data.nodes[i].x, y:data.nodes[i].y});
                    node.push({id: i+".1", label: '', image: DIR + 'none.png', shape: 'dot',size: 7,color: 'blue',x: data2.nodes[id].x, y:data2.nodes[id].y});
                    edge.push({from: i, to:  i+".1",color: 'red',smooth: false});
                    //edges.push({from: 7, to: 999,color: 'red',smooth: false});

                }
                container= document.getElementById('mynetwork3');
                container.innerHTML="";
                var data = {
                    nodes: node,
                    edges: edge
                };
                var options = {
                    physics: false,
                    interaction:{
                        multiselect: true
                    },
                    edges: {
                        edges:{
                            arrows: {
                                to:     {enabled: true, scaleFactor:1},
                                from:   {enabled: true, scaleFactor:1}
                            },
                            color: {
                                color:'#848484',
                                highlight:'#848484',
                                hover: '#848484',
                                inherit: 'from',
                                opacity:1.0
                            },
                            dashes: true,
                            font: {
                                color: '#343434',
                                size: 14, // px
                                face: 'arial',
                                background: 'none',
                                strokeWidth: 2, // px
                                strokeColor: '#ffffff',
                                align:'horizontal'
                            },
                            hidden: false,
                            hoverWidth: 1.5,
                            label: undefined,
                            length: undefined,
                            selectionWidth: 1,
                            selfReferenceSize:20,
                            title:undefined,
                            width: 1
                        }
                    }
                }
                update(container,data, options);
            }
            var addNewMap = function (){
                if(toDelete==null){
                    alert("Please Select a set of Nodes to Create a New Map");
                }
                else{
                    var container2 = document.getElementById('mynetwork2');
                    container2.innerHTML="";
                    //console.log(data);
                    var data2=remove(toDelete, data);
                    //console.log(data3);
                    //console.log(data2);
                    comparingMaps=1;
                    drawNewMap(container2,data,options);
                    // function call to have only data 2data2
                    // call the drawnewMap function
                    // done
                }

            }
            var remove = function (toKeep, arraySet){
                var flag=0;
                for	(var index = 0; index < arraySet.nodes.length; index++) {
                    //data.nodes.splice
                    //alert(toDelete.nodes[index]);
                    flag=0;
                    for	(var index2 = 0; index2 < toKeep.nodes.length; index2++) {
                        if (toKeep.nodes[index2]==arraySet.nodes[index].id){
                            flag=1;
                        }
                    }
                    if (flag==0) {
                        //alert(arraySet.nodes[index].id);
                        arraySet.nodes.splice(index,1);
                        remove(toKeep,arraySet);
                    }
                    flag =0;
                }
                return arraySet;
            }
            var deleteNode = function(){
                //draw();
                if(toDelete==null){
                    alert("Please Select a Node to Delete");
                }
                else{
                    //console.log(toDelete);
                    for	(var index = 0; index < toDelete.nodes.length; index++) {
                        //data.nodes.splice
                        //alert(toDelete.nodes[index]);
                        for	(var index2 = 0; index2 < data.nodes.length; index2++) {
                            if (toDelete.nodes[index]==data.nodes[index2].id){
                                //alert(index2);
                                data.nodes.splice(index2,1);
                            }
                        }}
                }
                //alert("out");
                //console.log(data);
                update(container,data, options);
                toDelete=null;
                //console.log(data);
            };
            var contentTest = function(){
                draw();
                //console.log(data);
            };
            head.addEventListener('click',contentTest, false);
            compareMaps.addEventListener('click', compareTwoMaps,false);
            newMap.addEventListener('click', addNewMap,false);
            deleteN.addEventListener('click',deleteNode, false);
            addNode.addEventListener('click',addaNode, false);
            network.on('doubleClick', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert("hello");
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                if (addingnodes!=0){
                    // Adding the node in here, before then wrapping up everything
                    nodes.push({ title: "Virus dd", label: 'Virus Added ',shadow: true,size: 5, image: DIR + 'virus4.png', shape: 'dot',x: params.pointer.canvas.x, y: params.pointer.canvas.y});
                    //console.log(params.pointer.DOM.x);
                    //console.log(params.pointer.DOM.y);
                    update(container,data, options);
                    //console.log(params);
                }
                addingnodes=0;
            });
            network.on('select', function(params) {
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                //console.log(params);
                //alert("select");
                toDelete=params;
                //
            });
            network.on('dragEnd', function(params){
                var id=-1;
                //document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                alert("dragend");
                //document.getElementById('writingpanel').innerHTML= 'Selected ' + params.nodes;
                console.log(params);
                console.log(nodes);
                if (params.nodes.length>0){
                    // we should get the position first
                    // To do get the array position of the element to be changed
                    for (var i=0; i<params.nodes.length; i++){
                        id= getPosition(params.nodes[i], nodes);
                        nodes[id].x=params.pointer.canvas.x;
                        nodes[id].y=params.pointer.canvas.y;
                    }
                    //alert(params.pointer.canvas.x);
                    //alert(nodes[id].x);
                }
                // save the node's new coordinates
                //
            });
            // Get the Position of an element in the array set of the nodeSet
            function getPosition(id,nodeSet){
                for(var i=0; i< nodeSet.length; i++){
                    if (id== nodeSet[i].id){
                        return i;
                    }
                }
                return -1;
            }

            network.on('click', function(params) {
                // document.getElementById('selection').innerHTML = 'Selection: ' + params.nodes;
                //alert(document.getElementById('selection').innerHTML);
                document.getElementById('writingpanel').innerHTML= 'We Selected Virus ' + params.nodes+" with X value"+params.pointer.canvas.x+" and Y value"+params.pointer.canvas.y;
                //console.log(params);
                //alert("click");
            });
        }

    }])
