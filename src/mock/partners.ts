export const MOCK_PARTNERS = [
    { 
        _id: 'mock-1', name: 'Pet Feliz Central', specialization: 'Petshop', 
        shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop',
        address: { street: 'Rua Raimundo Moreira Lima', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0306, -3.4111] } },
        workingHours: [
            { day: 'Segunda', active: true, open: '08:00', close: '18:00' },
            { day: 'Terça', active: true, open: '08:00', close: '18:00' },
            { day: 'Quarta', active: true, open: '08:00', close: '18:00' },
            { day: 'Quinta', active: true, open: '08:00', close: '18:00' },
            { day: 'Sexta', active: true, open: '08:00', close: '18:00' },
            { day: 'Sábado', active: true, open: '08:00', close: '14:00' },
            { day: 'Domingo', active: false }
        ],
        deliveryFeePerKm: 1.5,
        freeDeliveryMinimum: 50
    },
    { 
        _id: 'mock-2', name: 'Canto das Aves', specialization: 'Aves & Gaiolas', 
        shopLogo: 'https://images.unsplash.com/photo-1543466835-00a732f2c038?w=100&h=100&fit=crop',
        address: { street: 'Rua Principal', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0310, -3.4115] } }
    },
    { 
        _id: 'mock-3', name: 'Mundo Submarino', specialization: 'Aquarismo Profissional', 
        shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop',
        address: { street: 'Av. Antonio Sales', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0250, -3.4100] } }
    },
    { _id: 'mock-4', name: 'Casa do Criador', specialization: 'Casa de Ração', shopLogo: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0320, -3.4120] } } },
    { _id: 'mock-5', name: 'Dog Style Grooming', specialization: 'Banho e Tosa', shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0330, -3.4130] } } },
    { _id: 'mock-6', name: 'Gato Mania', specialization: 'Artigos Felinos', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0340, -3.4140] } } },
    { _id: 'mock-7', name: 'Reino Animal', specialization: 'Petshop Geral', shopLogo: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0300, -3.4100] } } },
    { _id: 'mock-8', name: 'Pet Shop Alegria', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0350, -3.4150] } } },
    { _id: 'mock-9', name: 'Cantinho do Totó', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0360, -3.4160] } } },
    { _id: 'mock-10', name: 'Bicho Mimado', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0370, -3.4170] } } },
    { _id: 'mock-11', name: 'Amigo Fiel', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0380, -3.4180] } } },
    { _id: 'mock-12', name: 'Planeta Pet', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0390, -3.4190] } } },
    { _id: 'mock-13', name: 'Espaço Animal', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0400, -3.4200] } } },
    { _id: 'mock-14', name: 'Pet Center', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0410, -3.4210] } } },
    { _id: 'mock-15', name: 'Mania de Cão', specialization: 'Petshop', shopLogo: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0420, -3.4220] } } },
];

export const MOCK_CLINICS = [
    { 
        _id: 'mock-v-1', name: 'Vila dos Bichos', specialization: 'Clínica Veterinária', 
        shopLogo: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop',
        address: { street: 'Rua Antônio Célio', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0280, -3.4116] } }
    },
    { 
        _id: 'mock-v-2', name: 'Saúde Animal', specialization: 'Hospital 24h', 
        shopLogo: 'https://images.unsplash.com/photo-1599443015574-be5fe8a05783?w=100&h=100&fit=crop',
        address: { street: 'Praça de Eventos', city: 'Paracuru', coordinates: { type: 'Point', coordinates: [-39.0305, -3.4102] } }
    },
    { _id: 'mock-v-3', name: 'Dr. Pet Care', specialization: 'Veterinária Geral', shopLogo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0315, -3.4111] } } },
    { _id: 'mock-v-4', name: 'Gato e Sapato', specialization: 'Clínica de Felinos', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0325, -3.4121] } } },
    { _id: 'mock-v-5', name: 'Vet Life', specialization: 'Clínica Veterinária', shopLogo: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0335, -3.4131] } } },
    { _id: 'mock-v-6', name: 'Centro MedVet', specialization: 'Clínica Veterinária', shopLogo: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0345, -3.4141] } } },
    { _id: 'mock-v-7', name: 'Pet Health', specialization: 'Hospital Veterinário', shopLogo: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0355, -3.4151] } } },
    { _id: 'mock-v-8', name: 'Clínica Amigo', specialization: 'Veterinária', shopLogo: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0365, -3.4161] } } },
    { _id: 'mock-v-9', name: 'Hovet Central', specialization: 'Hospital Veterinário', shopLogo: 'https://images.unsplash.com/photo-151673412186-a967f81ad0d7?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0375, -3.4171] } } },
    { _id: 'mock-v-10', name: 'Dr. Bichinho', specialization: 'Clínica Veterinária', shopLogo: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0385, -3.4181] } } },
    { _id: 'mock-v-11', name: 'Vet Care+', specialization: 'Clínica Veterinária', shopLogo: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0395, -3.4191] } } },
    { _id: 'mock-v-12', name: 'Pet Prime', specialization: 'Veterinária', shopLogo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0405, -3.4201] } } },
    { _id: 'mock-v-13', name: 'Clinicão', specialization: 'Clínica Veterinária', shopLogo: 'https://images.unsplash.com/photo-1581888227599-779811939961?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0415, -3.4211] } } },
    { _id: 'mock-v-14', name: 'Vet & Cia', specialization: 'Veterinária', shopLogo: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0425, -3.4221] } } },
    { _id: 'mock-v-15', name: 'Pata Amiga', specialization: 'Clínica Veterinária', shopLogo: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=100&h=100&fit=crop', address: { coordinates: { coordinates: [-39.0435, -3.4231] } } },
];
