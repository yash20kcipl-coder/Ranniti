import ExcelJS from 'exceljs';
import { MasterQueries } from '../../queries/master.queries';

export class SampleTemplateService {
  /**
   * Return pre-formatted human-readable sample CSV text for any master category pre-populated with actual DB labels
   */
  static async getSampleCsvTemplate(category: string): Promise<string> {
    const cat = category.toLowerCase().trim();

    if (cat === 'religions' || cat === 'religion') {
      return 'name\nHinduism\nIslam\nChristianity\nSikhism\nBuddhism\nJainism';
    }

    if (cat === 'castes' || cat === 'caste') {
      const religions = await MasterQueries.getReligions().catch(() => []);
      const r1 = religions[0]?.name || 'Hinduism';
      const r2 = religions[1]?.name || 'Islam';
      return `name,category,religionName\nBrahmin,General,${r1}\nRajput,General,${r1}\nYadav,OBC,${r2}\nJat,OBC,${r2}`;
    }

    if (cat === 'states' || cat === 'state') {
      return 'name\nMaharashtra\nUttar Pradesh\nBihar\nGujarat\nGoa';
    }

    if (cat === 'districts' || cat === 'district') {
      const states = await MasterQueries.getStates().catch(() => []);
      const s1 = states[0]?.name || 'Maharashtra';
      const s2 = states[1]?.name || 'Uttar Pradesh';
      return `name,stateName\nNagpur,${s1}\nPune,${s1}\nLucknow,${s2}\nPatna,${s2}`;
    }

    if (cat === 'talukas' || cat === 'taluka') {
      const states = await MasterQueries.getStates().catch(() => []);
      const districts = await MasterQueries.getDistricts().catch(() => []);
      const s1 = states[0]?.name || 'Maharashtra';
      const d1 = districts[0]?.name || 'Pune';
      return `State Name,District Name,Taluka Name\n${s1},${d1},Haveli\n${s1},${d1},Khed\n${s1},${d1},Shirur`;
    }

    if (cat === 'villages' || cat === 'village') {
      const districts = await MasterQueries.getDistricts().catch(() => []);
      const talukas = await MasterQueries.getTalukas().catch(() => []);
      const d1 = districts[0]?.name || 'Pune';
      const t1 = talukas[0]?.name || 'Haveli';
      return `District Name,Taluka Name,Village Name\n${d1},${t1},Wagholi\n${d1},${t1},Kothrud`;
    }

    if (cat === 'pcs' || cat === 'pc' || cat === 'parliamentary_constituencies') {
      const states = await MasterQueries.getStates().catch(() => []);
      const s1 = states[0]?.name || 'Maharashtra';
      const s2 = states[1]?.name || 'Uttar Pradesh';
      return `pcNumber,name,stateName\n1,Nagpur,${s1}\n2,Ramtek,${s1}\n3,Varanasi,${s2}`;
    }

    if (cat === 'acs' || cat === 'ac' || cat === 'assembly_constituencies') {
      const pcs = await MasterQueries.getPcs().catch(() => []);
      const districts = await MasterQueries.getDistricts().catch(() => []);
      const pc1 = pcs[0]?.name || 'Nagpur';
      const d1 = districts[0]?.name || 'Nagpur';
      return `acNumber,name,pcName,districtName\n52,Nagpur South West,${pc1},${d1}\n53,Nagpur South,${pc1},${d1}\n54,Nagpur East,${pc1},${d1}`;
    }

    if (cat === 'booths' || cat === 'booth' || cat === 'polling_booths') {
      const acs = await MasterQueries.getAcs().catch(() => []);
      const ac1 = acs[0]?.name || 'Nagpur South West';
      return `boothNumber,name,acName,locationBuilding,totalVoters\n1,Zilla Parishad Primary School Room 1,${ac1},Z.P. School,850\n2,Zilla Parishad Primary School Room 2,${ac1},Z.P. School,920`;
    }

    if (cat === 'parties' || cat === 'party' || cat === 'political_parties') {
      return 'name,abbreviation,symbolLogo\nBharatiya Janata Party,BJP,/uploads/parties/bjp.png\nIndian National Congress,INC,/uploads/parties/inc.png\nAam Aadmi Party,AAP,/uploads/parties/aap.png';
    }

    if (cat === 'voters' || cat === 'voter') {
      const booths = await MasterQueries.getBooths().catch(() => []);
      const b1 = booths[0]?.name || '1';
      return `Select Booth,SerialNo,SectionNo,HouseNo,EngFname,EngMname,EngSname,FName,MName,SName,IdCardNo,Gender,DateOfBirth(dd-MM-yyyy),MobileNo*,Email,AdharNo,PanNo,ProfessionType,Profession,Cast,SubCast,Religion,VoterType\n${b1},1,1,12/B,Rajesh,Kumar,Sharma,राजेश,कुमार,शर्मा,ABC1234567,Male,15-08-1985,9876543210,rajesh@example.com,123456789012,ABCDE1234F,Business,Shopkeeper,Brahmin,Kanyakubj,Hinduism,Voter`;
    }

    return 'name\nSample Entry 1\nSample Entry 2';
  }

  /**
   * Return pre-formatted human-readable sample Excel Buffer for any master category
   * pre-populated with actual DB labels and native Excel in-cell select dropdown options.
   * Supports both generic mode (no queryParams) and scoped mode (queryParams provided).
   */
  static async getSampleExcelTemplate(category: string, queryParams: Record<string, any> = {}): Promise<Buffer> {
    const cat = category.toLowerCase().trim();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ranniti';
    workbook.lastModifiedBy = 'Ranniti System';

    const sheet = workbook.addWorksheet('Sample Template');

    // Create hidden sheet for dynamic dropdown lists if needed
    let lookupSheet: ExcelJS.Worksheet | null = null;
    let nextLookupColIndex = 1;

    const getLookupSheet = () => {
      if (!lookupSheet) {
        lookupSheet = workbook.addWorksheet('DropdownData');
        lookupSheet.state = 'hidden';
      }
      return lookupSheet;
    };

    // Helper to format column index (1 -> A, 2 -> B, 27 -> AA, etc.)
    function getColumnLetter(colIndex: number): string {
      let temp: number;
      let letter = '';
      let index = colIndex;
      while (index > 0) {
        temp = (index - 1) % 26;
        letter = String.fromCharCode(65 + temp) + letter;
        index = Math.floor((index - temp) / 26);
      }
      return letter;
    }

    // Helper to add data validation dropdown for cells in a column across rows 2..1000
    const addListValidation = (colLetter: string, formula: string) => {
      for (let r = 2; r <= 1000; r++) {
        const cell = sheet.getCell(`${colLetter}${r}`);
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [formula],
          showErrorMessage: true,
          errorTitle: 'Invalid Selection',
          error: 'Please select a valid option from the dropdown list.',
        };
      }
    };

    // Helper to register dynamic DB values on hidden sheet and return range formula
    const registerDynamicLookup = (colName: string, items: string[]): string => {
      const colIdx = nextLookupColIndex++;
      const lSheet = getLookupSheet();
      lSheet.getCell(1, colIdx).value = colName;
      const cleanItems = Array.from(new Set(items.map((i) => (i ? String(i).trim() : '')).filter(Boolean)));
      const listToUse = cleanItems.length > 0 ? cleanItems : ['Sample Entry'];

      listToUse.forEach((item, idx) => {
        lSheet.getCell(idx + 2, colIdx).value = item;
      });

      const colLetter = getColumnLetter(colIdx);
      const endRow = listToUse.length + 1;
      return `DropdownData!$${colLetter}$2:$${colLetter}$${endRow}`;
    };

    // Category-specific targeted query execution and template construction
    if (cat === 'voters' || cat === 'voter') {
      const { acId, boothId } = queryParams;
      const [religions, castes, parties, talukas, villages, booths] = await Promise.all([
        MasterQueries.getReligions().catch(() => []),
        MasterQueries.getCastes().catch(() => []),
        MasterQueries.getParties().catch(() => []),
        MasterQueries.getTalukas(queryParams.districtId).catch(() => []),
        MasterQueries.getVillages(queryParams.talukaId).catch(() => []),
        acId || boothId
          ? MasterQueries.getBooths({ acId: acId as string, limit: 100 }).catch(() => [])
          : MasterQueries.getBooths({ limit: 50 }).catch(() => []),
      ]);

      const religionNames = religions.map((r) => r.name);
      const parentCastes = castes.filter((c) => !c.parentCasteId);
      const subCastes = castes.filter((c) => Boolean(c.parentCasteId));
      const casteNames = (parentCastes.length > 0 ? parentCastes : castes).map((c) => c.name);
      const subcasteNames = subCastes.length > 0 ? subCastes.map((c) => c.name) : ['Kanyakubj', 'Deshastha', 'Kokanastha', 'Kunbi Maratha', 'Chitpavan'];
      const partyNames = parties.length > 0 ? parties.map((p) => p.name) : ['Bharatiya Janata Party', 'Indian National Congress', 'Aam Aadmi Party'];
      const talukaNames = talukas.length > 0 ? talukas.map((t) => t.name) : ['Haveli', 'Karjat', 'Shirur', 'Baramati'];
      const villageNames = villages.length > 0 ? (villages as any[]).map((v: any) => v.name) : ['Wagholi', 'Kothrud', 'Hadapsar', 'Bavdhan'];
      const boothList = Array.isArray(booths) ? booths : (booths as any)?.booths || [];
      const boothNames = boothList.map((b: any) => b.name);

      const headers = [
        'Select Booth', 'SerialNo', 'SectionNo', 'HouseNo',
        'EngFname', 'EngMname', 'EngSname', 'FName', 'MName', 'SName',
        'IdCardNo', 'Gender', 'DateOfBirth(dd-MM-yyyy)', 'MobileNo*', 'Email',
        'AdharNo', 'PanNo', 'ProfessionType', 'Profession',
        'Cast', 'SubCast', 'Religion', 'Party', 'Taluka', 'Village',
        'VoterType', 'Status', 'Is Dead', 'Is Family Influencer', 'Is Social Influencer', 'Blood Group',
      ];
      sheet.addRow(headers);

      const b1 = boothNames[0] || 'Zilla Parishad Primary School Room 1';
      const r1 = religionNames[0] || 'Hinduism';
      const c1 = casteNames[0] || 'Brahmin';
      const sc1 = subcasteNames[0] || 'Kanyakubj';
      const p1 = partyNames[0] || 'Bharatiya Janata Party';
      const t1 = talukaNames[0] || 'Haveli';
      const v1 = villageNames[0] || 'Wagholi';

      sheet.addRow([
        b1, 1, 1, '12/B',
        'Rajesh', 'Kumar', 'Sharma', 'राजेश', 'कुमार', 'शर्मा',
        'ABC1234567', 'Male', '15-08-1985', '9876543210', 'rajesh@example.com',
        '123456789012', 'ABCDE1234F', 'Business', 'Shopkeeper',
        c1, sc1, r1, p1, t1, v1,
        'Voter', 'ACTIVE', 'No', 'No', 'No', 'B+',
      ]);

      const boothFormula = registerDynamicLookup('Booths', boothNames);
      addListValidation('A', boothFormula);
      addListValidation('L', '"Male,Female,Other"');

      for (let r = 2; r <= 1000; r++) {
        const cell = sheet.getCell(`M${r}`);
        cell.numFmt = 'dd-mm-yyyy';
        cell.dataValidation = {
          type: 'date',
          operator: 'between',
          formulae: [new Date('1900-01-01'), new Date('2099-12-31')],
          showErrorMessage: true,
          errorTitle: 'Invalid Date',
          error: 'Please enter or select a valid date in DD-MM-YYYY format.',
        };
      }

      addListValidation('R', '"Business,Service,Agriculture,Student,Housewife,Self-Employed,Unemployed,Professional,Other"');
      addListValidation('T', registerDynamicLookup('Castes', casteNames));
      addListValidation('U', registerDynamicLookup('Subcastes', subcasteNames));
      addListValidation('V', registerDynamicLookup('Religions', religionNames));
      addListValidation('W', registerDynamicLookup('Parties', partyNames));
      addListValidation('X', registerDynamicLookup('Talukas', talukaNames));
      addListValidation('Y', registerDynamicLookup('Villages', villageNames));
      addListValidation('Z', '"Voter,Neutral Voter,Non Voter,Student,Senior,NRI,VIP"');
      addListValidation('AA', '"ACTIVE,INACTIVE,SHIFTED,UNVERIFIED,PENDING"');
      addListValidation('AB', '"Yes,No"');
      addListValidation('AC', '"Yes,No"');
      addListValidation('AD', '"Yes,No"');
      addListValidation('AE', '"A+,A-,B+,B-,AB+,AB-,O+,O-"');

    } else if (cat === 'castes' || cat === 'caste') {
      const religions = await MasterQueries.getReligions().catch(() => []);
      const religionNames = religions.map((r) => r.name);
      sheet.addRow(['name', 'category', 'religionName']);
      const r1 = religionNames[0] || 'Hinduism';
      sheet.addRow(['Brahmin', 'General', r1]);

      addListValidation('B', '"General,OBC,SC,ST,Other"');
      const religionFormula = registerDynamicLookup('Religions', religionNames);
      addListValidation('C', religionFormula);

    } else if (cat === 'religions' || cat === 'religion') {
      sheet.addRow(['name']);
      sheet.addRow(['Hinduism']);
      sheet.addRow(['Islam']);
      sheet.addRow(['Christianity']);
      sheet.addRow(['Sikhism']);
      sheet.addRow(['Buddhism']);
      sheet.addRow(['Jainism']);

    } else if (cat === 'states' || cat === 'state') {
      sheet.addRow(['name']);
      sheet.addRow(['Maharashtra']);
      sheet.addRow(['Uttar Pradesh']);
      sheet.addRow(['Karnataka']);
      sheet.addRow(['Gujarat']);

    } else if (cat === 'districts' || cat === 'district') {
      const states = await MasterQueries.getStates().catch(() => []);
      let stateNames = states.map((s) => s.name);
      let defaultState = stateNames[0] || 'Maharashtra';

      if (queryParams.stateId) {
        const matched = states.find((s) => String(s.id).toLowerCase() === String(queryParams.stateId).toLowerCase());
        if (matched) {
          defaultState = matched.name;
          stateNames = [matched.name, ...stateNames.filter((n) => n !== matched.name)];
        }
      }

      sheet.addRow(['name', 'stateName']);
      sheet.addRow(['Nagpur', defaultState]);
      sheet.addRow(['Pune', defaultState]);

      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('B', stateFormula);

    } else if (cat === 'pcs' || cat === 'pc' || cat === 'parliamentary_constituencies' || cat === 'parliamentary_constituency') {
      const states = await MasterQueries.getStates().catch(() => []);
      let stateNames = states.map((s) => s.name);
      let defaultState = stateNames[0] || 'Maharashtra';

      if (queryParams.stateId) {
        const matched = states.find((s) => String(s.id).toLowerCase() === String(queryParams.stateId).toLowerCase());
        if (matched) {
          defaultState = matched.name;
          stateNames = [matched.name, ...stateNames.filter((n) => n !== matched.name)];
        }
      }

      sheet.addRow(['pcNumber', 'name', 'stateName']);
      sheet.addRow([1, 'Nagpur', defaultState]);
      sheet.addRow([2, 'Ramtek', defaultState]);

      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('C', stateFormula);

    } else if (cat === 'acs' || cat === 'ac' || cat === 'assembly_constituencies' || cat === 'assembly_constituency') {
      const [pcs, districts] = await Promise.all([
        MasterQueries.getPcs().catch(() => []),
        MasterQueries.getDistricts(queryParams.stateId).catch(() => []),
      ]);

      let pcNames = pcs.map((p) => p.name);
      let districtNames = districts.map((d) => d.name);
      let defaultPc = pcNames[0] || 'Nagpur';
      let defaultDistrict = districtNames[0] || 'Nagpur';

      if (queryParams.pcId) {
        const matchedPc = pcs.find((p) => String(p.id).toLowerCase() === String(queryParams.pcId).toLowerCase());
        if (matchedPc) {
          defaultPc = matchedPc.name;
          pcNames = [matchedPc.name, ...pcNames.filter((n) => n !== matchedPc.name)];
        }
      }

      if (queryParams.districtId) {
        const matchedDist = districts.find((d) => String(d.id).toLowerCase() === String(queryParams.districtId).toLowerCase());
        if (matchedDist) {
          defaultDistrict = matchedDist.name;
          districtNames = [matchedDist.name, ...districtNames.filter((n) => n !== matchedDist.name)];
        }
      }

      sheet.addRow(['acNumber', 'name', 'pcName', 'districtName']);
      sheet.addRow([52, 'Nagpur South West', defaultPc, defaultDistrict]);
      sheet.addRow([53, 'Nagpur South', defaultPc, defaultDistrict]);

      const pcFormula = registerDynamicLookup('PCs', pcNames);
      addListValidation('C', pcFormula);

      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('D', distFormula);

    } else if (cat === 'talukas' || cat === 'taluka') {
      const [districts, states] = await Promise.all([
        MasterQueries.getDistricts(queryParams.stateId).catch(() => []),
        MasterQueries.getStates().catch(() => []),
      ]);

      let districtNames = districts.map((d) => d.name);
      let stateNames = states.map((s) => s.name);
      let defaultDistrict = districtNames[0] || 'Pune';
      let defaultState = stateNames[0] || 'Maharashtra';

      if (queryParams.districtId) {
        const matchedDist = districts.find((d) => String(d.id).toLowerCase() === String(queryParams.districtId).toLowerCase());
        if (matchedDist) {
          defaultDistrict = matchedDist.name;
          districtNames = [matchedDist.name, ...districtNames.filter((n) => n !== matchedDist.name)];
          if (matchedDist.stateName) {
            defaultState = matchedDist.stateName;
          }
        }
      } else if (queryParams.stateId) {
        const matchedState = states.find((s) => String(s.id).toLowerCase() === String(queryParams.stateId).toLowerCase());
        if (matchedState) {
          defaultState = matchedState.name;
          stateNames = [matchedState.name, ...stateNames.filter((n) => n !== matchedState.name)];
        }
      }

      sheet.addRow(['name', 'districtName', 'stateName']);
      sheet.addRow(['Haveli', defaultDistrict, defaultState]);
      sheet.addRow(['Baramati', defaultDistrict, defaultState]);

      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('B', distFormula);

      const stateFormula = registerDynamicLookup('States', stateNames);
      addListValidation('C', stateFormula);

    } else if (cat === 'villages' || cat === 'village') {
      const [talukas, districts] = await Promise.all([
        MasterQueries.getTalukas(queryParams.districtId).catch(() => []),
        MasterQueries.getDistricts(queryParams.stateId).catch(() => []),
      ]);

      let talukaNames = talukas.map((t) => t.name);
      let districtNames = districts.map((d) => d.name);
      let defaultTaluka = talukaNames[0] || 'Haveli';
      let defaultDistrict = districtNames[0] || 'Pune';

      if (queryParams.talukaId) {
        const matchedTaluka = talukas.find((t) => String(t.id).toLowerCase() === String(queryParams.talukaId).toLowerCase());
        if (matchedTaluka) {
          defaultTaluka = matchedTaluka.name;
          talukaNames = [matchedTaluka.name, ...talukaNames.filter((n) => n !== matchedTaluka.name)];
          if (matchedTaluka.districtName) {
            defaultDistrict = matchedTaluka.districtName;
          }
        }
      }

      if (queryParams.districtId && !queryParams.talukaId) {
        const matchedDist = districts.find((d) => String(d.id).toLowerCase() === String(queryParams.districtId).toLowerCase());
        if (matchedDist) {
          defaultDistrict = matchedDist.name;
          districtNames = [matchedDist.name, ...districtNames.filter((n) => n !== matchedDist.name)];
        }
      }

      sheet.addRow(['name', 'talukaName', 'districtName']);
      sheet.addRow(['Wagholi', defaultTaluka, defaultDistrict]);
      sheet.addRow(['Kothrud', defaultTaluka, defaultDistrict]);

      const talukaFormula = registerDynamicLookup('Talukas', talukaNames);
      addListValidation('B', talukaFormula);

      const distFormula = registerDynamicLookup('Districts', districtNames);
      addListValidation('C', distFormula);

    } else if (cat === 'wards' || cat === 'ward') {
      const acs = await MasterQueries.getAcs(queryParams.pcId as string, queryParams.districtId as string, queryParams.stateId as string).catch(() => []);
      let acNames = acs.map((a) => a.name);
      let defaultAc = acNames[0] || 'Nagpur South West';

      if (queryParams.acId) {
        const matchedAc = acs.find((a) => String(a.id).toLowerCase() === String(queryParams.acId).toLowerCase());
        if (matchedAc) {
          defaultAc = matchedAc.name;
          acNames = [matchedAc.name, ...acNames.filter((n) => n !== matchedAc.name)];
        }
      }

      sheet.addRow(['wardNumber', 'name', 'acName']);
      sheet.addRow([1, 'Ward No. 1', defaultAc]);
      sheet.addRow([2, 'Ward No. 2', defaultAc]);

      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);

    } else if (cat === 'booths' || cat === 'booth' || cat === 'polling_booths' || cat === 'polling_booth') {
      const [acs, wards] = await Promise.all([
        MasterQueries.getAcs(queryParams.pcId as string, queryParams.districtId as string, queryParams.stateId as string).catch(() => []),
        queryParams.acId
          ? MasterQueries.getWards(queryParams.acId as string).catch(() => [])
          : MasterQueries.getWards().catch(() => []),
      ]);

      let acNames = acs.map((a) => a.name);
      let defaultAc = acNames[0] || 'Nagpur South West';

      if (queryParams.acId) {
        const matchedAc = acs.find((a) => String(a.id).toLowerCase() === String(queryParams.acId).toLowerCase());
        if (matchedAc) {
          defaultAc = matchedAc.name;
          acNames = [matchedAc.name, ...acNames.filter((n) => n !== matchedAc.name)];
        }
      }

      const wardList = Array.isArray(wards) ? wards : (wards as any)?.wards || [];
      const wardNames = wardList.map((w: any) => w.name);
      const defaultWard = wardNames[0] || 'Ward No. 1';

      sheet.addRow(['boothNumber', 'name', 'acName', 'wardName', 'locationBuilding', 'totalVoters']);
      sheet.addRow([1, 'Zilla Parishad Primary School Room 1', defaultAc, defaultWard, 'Z.P. School', 850]);
      sheet.addRow([2, 'Zilla Parishad Primary School Room 2', defaultAc, defaultWard, 'Z.P. School', 920]);

      const acFormula = registerDynamicLookup('ACs', acNames);
      addListValidation('C', acFormula);

      if (wardNames.length > 0) {
        const wardFormula = registerDynamicLookup('Wards', wardNames);
        addListValidation('D', wardFormula);
      }

    } else if (cat === 'parties' || cat === 'party' || cat === 'political_parties' || cat === 'political_party') {
      sheet.addRow(['name', 'abbreviation', 'symbolLogo']);
      sheet.addRow(['Bharatiya Janata Party', 'BJP', '/uploads/parties/bjp.png']);
      sheet.addRow(['Indian National Congress', 'INC', '/uploads/parties/inc.png']);
      sheet.addRow(['Aam Aadmi Party', 'AAP', '/uploads/parties/aap.png']);

    } else if (cat === 'demo' || cat === 'demos' || cat === 'bulk_test' || cat === 'bulk_upload_demos') {
      sheet.addRow([
        'Full Name',
        'EPIC No',
        'Relative Name',
        'Gender',
        'Age',
        'Mobile',
        'Email',
        'Booth No',
        'Section Name',
        'Address',
        'Status',
      ]);
      sheet.addRow(['Ramesh Chandra Sharma', 'ABC1234567', 'Kailash Sharma', 'Male', 42, '9876543210', 'ramesh@example.com', '101', 'Main Bazaar', '124, Gandhi Chowk', 'active']);
      sheet.addRow(['Priya Anant Deshmukh', 'XYZ9876543', 'Anant Deshmukh', 'Female', 36, '9822012345', 'priya@example.com', '101', 'Shivaji Nagar', '15, Model Colony', 'active']);
      sheet.addRow(['Sunil Ramrao Patil', 'DEF4567890', 'Ramrao Patil', 'Male', 58, '9823456789', 'sunil@example.com', '102', 'Station Road', '42, Station Plot', 'active']);
      sheet.addRow(['Kavita Suresh Verma', 'GHI7890123', 'Suresh Verma', 'Female', 29, '9811122233', 'kavita@example.com', '102', 'Nehru Ward', '88, Anand Vihar', 'active']);

    } else {
      sheet.addRow(['name']);
      sheet.addRow(['Sample Entry 1']);
      sheet.addRow(['Sample Entry 2']);
    }

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FF1F2937' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 24;

    // Auto-fit column widths
    sheet.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) maxLen = valStr.length;
      });
      col.width = Math.max(maxLen + 5, 18);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
