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
    this.shipImage = ko.observable("http://image.eveonline.com/Type/"+data.victim.shipTypeID+"_64.png");
    this.items = data.items;
    this.doctrine = ko.observable("N/A");
    this.corporation = ko.observable(data.victim.corporationName);
    this.corporationImage = ko.observable("http://image.eveonline.com/Corporation/"+data.victim.corporationID+"_32.png");
    this.onReimbursementTab = ko.observable(false);

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
}
var solarsystem_names_typeahead = [];
for(var k in solarsystems) solarsystem_names_typeahead.push(solarsystems[k]);
$("#inputSolarsystem").typeahead({
    name: 'solarsystems',
    local: solarsystem_names_typeahead
});
welp = new WelpViewModel()
ko.applyBindings(welp);
