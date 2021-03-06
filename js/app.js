function typeImage32(typeID) {
    return "http://image.eveonline.com/Type/"+typeID+"_32.png";
}
function typeImage64(typeID) {
    return "http://image.eveonline.com/Type/"+typeID+"_64.png";
}

function sortTypes(a, b) {
    return a.typeID - b.typeID;
}

function KillMail(data) {
    this.killID = ko.observable(data.killID);
    this.killMailLink = ko.observable("https://zkillboard.com/detail/"+data.killID);
    this.solarSystemID = ko.observable(solarsystems[data.solarSystemID]);
    this.killTime = ko.observable(data.killTime);
    this.victim = ko.observable(data.victim.characterName);
    if(types[data.victim.shipTypeID])
        this.ship = ko.observable(types[data.victim.shipTypeID]);
    else
        this.ship = ko.observable('Pod');
    this.doctrine = ko.observable("N/A");
    this.corporation = ko.observable(data.victim.corporationName);
    this.corporationImage = ko.observable("http://image.eveonline.com/Corporation/"+data.victim.corporationID+"_32.png");
    this.shipImage = ko.observable(typeImage64(data.victim.shipTypeID))
    this.onReimbursementTab = ko.observable(false);
    this.showVictim = ko.observable(true);
    this.showFitting = ko.observable(false);
    this.switchText = ko.observable("Fitting");
    this.switchView = function () {
        this.showVictim(!this.showVictim());
        this.showFitting(!this.showFitting());
        if(this.showFitting()) {
            this.switchText("Victim");
            $("[data-toggle='tooltip']").tooltip({});
        } else this.switchText("Fitting");
    }
    this.lows = ko.observable([]);
    this.mids = ko.observable([]);
    this.highs = ko.observable([]);
    this.rigs = ko.observable([]);
    this.subsystems = ko.observableArray([]);

    for(var i in data.items) {
        var item = data.items[i];
        var name = types[item.typeID];
        if(item.flag >= 11 && item.flag <= 18)
            this.lows().push(item);
        if(item.flag >= 19 && item.flag <= 26 && $.inArray(item.typeID, ammotypes) < 0)
            this.mids().push(item);
        if(item.flag >= 27 && item.flag <= 34 && $.inArray(item.typeID, ammotypes) < 0)
            this.highs().push(item);
        if(item.flag >= 92 && item.flag <= 99) 
            this.rigs().push(item);
        if(item.flag >= 125 && item.flag <= 132)
            this.subsystems().push(item);
    }
    this.highs().sort(sortTypes);
    this.mids().sort(sortTypes);
    this.lows().sort(sortTypes);
    this.rigs().sort(sortTypes);
    this.checkFitting =  function(doctrines) {
        if(this.ship in doctrines) {
            this.doctrine(doctrines.ship[0].name);
        } else {
            this.doctrine("skrot");
        }
    }
}

function WelpViewModel() {
    var self = this;

    /* data */
    self.killmails = ko.observableArray([]);
    self.reimbursementTab = ko.observableArray([]);
    self.oldestMail = ko.observable('');
    self.newestMail = ko.observable('');
    self.fleetcommander = ko.observable('');
    self.fleetname = ko.observable('');
    self.showExport = ko.observable(false);
    self.loading = ko.observable(false);


    /* killmail filters */
    self.apionly = ko.observable(true);
    self.filterDisabled = ko.observable(false)
    self.solarsystem = ko.observable('');
    self.pagenumber = ko.observable(1);
    self.exportdata = ko.observable('');

    /* data loading */
    self.filterMails = function() {
        var url = "https://zkillboard.com/api/no-attackers/corporationID/"+settings.corporationID+"/losses";
        if(self.apionly())
            url += "/api-only";
        if(self.solarsystem().length > 0)
            url += "/solarSystemID/"+mapsolarsystems[self.solarsystem().toLowerCase()];
        url += "/page/"+self.pagenumber()+"/";
        return url;
    }
    self.updateKillMails = function() {
        self.killmails([]);
        self.loading(true);
        $.getJSON(self.filterMails(), function(allmails) {
            if(!allmails || allmails.length == 0) {
                $("#killMailList").html('<h2 class="text-center">No killmails found</h2>');
                self.newestMail('');
                self.oldestMail('');
            } else {
                var mappedKillMails = $.map(allmails, function(mail) { 
                    if(!mail)
                        return;
                    var km = new KillMail(mail);
                    //km.checkFitting(doctrines)
                    return km;
                });
                self.killmails(mappedKillMails);
                self.newestMail(self.killmails()[0].killTime());
                self.oldestMail(self.killmails()[allmails.length-1].killTime());
            }
            self.loading(false);
        });
    }
    self.updateKillMails();

    /* button callbacks */
    self.addKillMail = function(killmail) {
        killmail.onReimbursementTab(true);
        self.reimbursementTab.push(killmail);
    }
    self.removeKillMail = function(killmail) {
        self.reimbursementTab.remove(killmail);
        killmail.onReimbursementTab(false);
    }
    self.newer = function() {
        if(self.pagenumber() > 1) {
            self.pagenumber(self.pagenumber()-1);
            self.updateKillMails();
        }
    }
    self.older = function() {
        self.pagenumber(self.pagenumber()+1);
        self.updateKillMails();
    }
    self.clearList = function() {
        ko.utils.arrayForEach(self.reimbursementTab(), function(mail) {
            mail.onReimbursementTab(false);
        });
        self.reimbursementTab([]);
    }
    self.openExport = function() {
        self.showExport(true);
        $("#exportmodal").modal('show');
        var data = 'FC: '+self.fleetcommander()+'\n';
        data += 'Fleet: '+self.fleetname()+'\n';
        data += '----------------------------\n';
        ko.utils.arrayForEach(self.reimbursementTab(), function(mail) {
            data += mail.killTime()+'\n';
            data += mail.victim() + '\n';
            data += mail.ship()+'\n';
            data += '[URL="'+mail.killMailLink()+'"]'+mail.killMailLink()+'[/URL]\n\n';
        });
        self.exportdata(data);
    }
    self.closeExport = function () {
        $("#exportmodal").modal('hide');
        self.showExport(false);
    }
    self.inspectFit = function (killmail) {
        console.log(killmail);
    }

    /* events */
    self.checkSystemName = function () {
        if(!mapsolarsystems[self.solarsystem().toLowerCase()] && self.solarsystem().length > 0) {
            $("#inputSolarSystem").addClass("error");
            self.filterDisabled(true);
        } else {
            $("#inputSolarSystem").removeClass("error");
            self.filterDisabled(false);
        }
    }

    /* helpers */
}
var solarsystem_names_typeahead = [];
for(var k in solarsystems) solarsystem_names_typeahead.push(solarsystems[k]);
$("#inputSolarsystem").typeahead({
    name: 'solarsystems',
    local: solarsystem_names_typeahead
});
welp = new WelpViewModel()
ko.applyBindings(welp);
