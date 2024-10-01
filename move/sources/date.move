module admin::date {

    //==============================================================================================
    // Dependencies
    //==============================================================================================

    use aptos_framework::randomness;
    use aptos_framework::account::{Self, SignerCapability};
    use std::signer;
    use std::string::{Self, String};
    use aptos_token_objects::token;
    use aptos_token_objects::collection;
    use aptos_framework::option;
    use aptos_framework::event;
    use std::string_utils;
    use std::object;
    use aptos_std::smart_vector::{Self, SmartVector};
    use aptos_framework::timestamp;
    use aptos_token_objects::property_map;
    use std::bcs;
    use std::vector;

    #[test_only]
    use std::debug;

    //==============================================================================================
    // Errors
    //==============================================================================================

    const ERROR_SIGNER_NOT_ADMIN: u64 = 0;
    const ERROR_USER_EXISTED: u64 = 1;
    const ERROR_NOT_OWNER: u64 = 2;
    const ERROR_OTHER: u64 = 3;

    //==============================================================================================
    // Constants
    //==============================================================================================

    // Seed for resource account creation
    const SEED: vector<u8> = b"date";

    // NFT collection information
    const COLLECTION_NAME: vector<u8> = b"AptDate";
    const COLLECTION_DESCRIPTION: vector<u8> = b"find your perfect match powered by the Aptos blockchain";
    const COLLECTION_URI: vector<u8> = b"ipfs://tbc";

    const PROPERTY_KEY: vector<vector<u8>> = vector[
        b"PROFILE_NAME",
        b"AGE",
        b"GENDER",
        b"SEEKING",
        b"PROFILE DESCRIPTION",
        b"TELEGRAM"
    ];

    //==============================================================================================
    // Module Structs
    //==============================================================================================

    // contains details of each Profile.
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Profile has key {
        // Used for editing the token data
        mutator_ref: token::MutatorRef,
        // Used for burning the token
        burn_ref: token::BurnRef,
        // Used for editing the token's property_map
        property_mutator_ref: property_map::MutatorRef,
        // // profile details
        // name: String,
        // age: u8,
        // gender: bool, //0=women, 1=men
        // seeking: u8, //0=women, 1=men, 2=both
        // description: String, //limit to 100 words
        // tg: String,
    }

    /*
    Information to be used in the module
*/
    struct State has key {
        // signer cap of the module's resource account
        signer_cap: SignerCapability,
        // profile <profile obj add>
        m0: SmartVector<address>, //men seeking women
        m1: SmartVector<address>, //men seeking men
        f0: SmartVector<address>, //women seeking women
        f1: SmartVector<address>, //women seeking men
        mf2: SmartVector<address>, //bi
        // user account address
        users: SmartVector<address>,
        // Events
        profile_minted_events: u64,
    }

    //==============================================================================================
    // Event structs
    //==============================================================================================
    #[event]
    struct ProfileMintedEvent has store, drop {
        // user
        user: address,
        // profile nft object address
        profile: address,
        // timestamp
        timestamp: u64
    }

    #[event]
    struct MatchedEvent has store, drop {
        match_found: bool,
        // userA nft object address
        profileA: address,
        // userB nft object address
        profileB: address,
        // timestamp
        timestamp: u64
    }
    //==============================================================================================
    // Functions
    //==============================================================================================

    fun init_module(admin: &signer) {
        let (resource_signer, resource_cap) = account::create_resource_account(admin, SEED);

        // Create an NFT collection with an unlimited supply and the following aspects:
        collection::create_unlimited_collection(
            &resource_signer,
            string::utf8(COLLECTION_DESCRIPTION),
            string::utf8(COLLECTION_NAME),
            option::none(),
            string::utf8(COLLECTION_URI)
        );

        // Create the State global resource and move it to the admin account
        let state = State{
            signer_cap: resource_cap,
            m0: smart_vector::new(),
            m1: smart_vector::new(),
            f0: smart_vector::new(),
            f1: smart_vector::new(),
            mf2: smart_vector::new(),
            users: smart_vector::new(),
            profile_minted_events: 0
        };
        move_to<State>(admin, state);
    }

    public entry fun mint_profile(
        user: &signer,
        // profile details
        name: String,
        age: u8,
        gender: bool, //1 for men
        seeking: u8, //0=women,1=men,2=both
        description: String, //limit to 100 words
        tg: String,
        photo: String
    ) acquires State {
        let user_add = signer::address_of(user);
        let state = borrow_global_mut<State>(@admin);
        assert!(!state.users.contains(&user_add), ERROR_USER_EXISTED);
        let res_signer = account::create_signer_with_capability(&state.signer_cap);
        let token_name = string_utils::format2(&b"#{}:{}", state.users.length(), name);
        let self = if(gender){string::utf8(b"man")}else{string::utf8(b"woman")};
        let seek = if(seeking == 0){
            string::utf8(b"woman")
        }else if(seeking == 1){
            string::utf8(b"man")
        }else{
            string::utf8(b"bi")
        };
        let token_des = string_utils::format4(&b"#{},{},{} seeking {}", name, age, self, seek);
        // Create a new named token:
        let token_const_ref = token::create_named_token(
            &res_signer,
            string::utf8(COLLECTION_NAME),
            token_des,
            token_name,
            option::none(),
            photo //token uri
        );
        let obj_signer = object::generate_signer(&token_const_ref);
        let obj_add = object::address_from_constructor_ref(&token_const_ref);

        // Transfer the token to the user account
        object::transfer_raw(&res_signer, obj_add, user_add);

        let prop_keys = vector[
            string::utf8(*vector::borrow(&PROPERTY_KEY,0)),
            string::utf8(*vector::borrow(&PROPERTY_KEY,1)),
            string::utf8(*vector::borrow(&PROPERTY_KEY,2)),
            string::utf8(*vector::borrow(&PROPERTY_KEY,3)),
            string::utf8(*vector::borrow(&PROPERTY_KEY,4)),
            string::utf8(*vector::borrow(&PROPERTY_KEY,5))
        ];

        let prop_types = vector[
            string::utf8(b"0x1::string::String"),
            string::utf8(b"u8"),
            string::utf8(b"bool"),
            string::utf8(b"u8"),
            string::utf8(b"0x1::string::String"),
            string::utf8(b"0x1::string::String"),
        ];

        let prop_values = vector[
            bcs::to_bytes(&name),
            bcs::to_bytes(&age),
            bcs::to_bytes(&gender),
            bcs::to_bytes(&seeking),
            bcs::to_bytes(&description),
            bcs::to_bytes(&tg)
        ];

        let token_prop_map = property_map::prepare_input(prop_keys,prop_types,prop_values);
        property_map::init(&token_const_ref,token_prop_map);

        // Create the Profile Token object and move it to the new token object signer
        let profile = Profile {
            mutator_ref: token::generate_mutator_ref(&token_const_ref),
            burn_ref: token::generate_burn_ref(&token_const_ref),
            property_mutator_ref: property_map::generate_mutator_ref(&token_const_ref),
            // name,
            // age,
            // gender, //1 for men
            // seeking, //1 for men
            // description, //limit to 100 words
            // tg,
        };

        move_to<Profile>(&obj_signer, profile);

        if(seeking == 2){
            state.mf2.push_back(obj_add);
        }else if(seeking == 1){
            if(gender){
                state.m1.push_back(obj_add);
            }else{
                state.f1.push_back(obj_add);
            }
        }else{
            if(gender){
                state.m0.push_back(obj_add);
            }else{
                state.f0.push_back(obj_add);
            }
        };

        //block transfer between normal users
        object::disable_ungated_transfer(&object::generate_transfer_ref(&token_const_ref));

        state.users.push_back(user_add);

        // Emit a new ReadingMintedEvent
        event::emit(ProfileMintedEvent{
            user: user_add,
            profile: obj_add,
            timestamp: timestamp::now_seconds()
        });
        state.profile_minted_events = state.profile_minted_events + 1;
    }

    #[randomness]
    entry fun match(
        user: &signer,
        profile: address,
    )acquires State {
        let state = borrow_global_mut<State>(@admin);
        let user_add = signer::address_of(user);
        assert!(object::is_owner(object::address_to_object<Profile>(profile), user_add), ERROR_NOT_OWNER);
        let matched=@0x0;
        //bi
        let seeking = property_map::read_u8<Profile>(&object::address_to_object<Profile>(profile), &string::utf8(*PROPERTY_KEY.borrow(
            3
        )));
        let gender = property_map::read_bool<Profile>(&object::address_to_object<Profile>(profile), &string::utf8(*PROPERTY_KEY.borrow(
            2
        )));
        if(seeking == 2){
            if(state.mf2.length() > 1){
                let index = randomness::u64_range(0, state.mf2.length());
                matched = *state.mf2.borrow(index);
                if(matched == user_add){
                    if(state.mf2.length() == 2){
                        if(index == 0){
                            matched = *state.mf2.borrow(1);
                        }else{
                            matched = *state.mf2.borrow(0);
                        }
                    }else{
                        if(index == 0){
                            index = randomness::u64_range(1, state.mf2.length());
                            matched = *state.mf2.borrow(index);
                        }else if(index == state.mf2.length()-1){
                            index = randomness::u64_range(1, state.mf2.length()-1);
                            matched = *state.mf2.borrow(index);
                        }else{
                            let left = randomness::u64_range(0, index);
                            let right = randomness::u64_range(index + 1, state.mf2.length());
                            let rand = randomness::u64_range(0, 2);
                            if(rand == 0){
                                matched = *state.mf2.borrow(left);
                            }else{
                                matched = *state.mf2.borrow(right);
                            }
                        }
                    };
                }
            }
        }else if(seeking == 1){
            if(gender) {
                //11
                if (state.m1.length() != 0) {
                    let index = randomness::u64_range(0, state.m1.length());
                    matched = *state.m1.borrow(index);
                }
            }
            else{ //01
                if(state.f1.length()!=0){
                    let index = randomness::u64_range(0, state.f1.length());
                    matched = *state.f1.borrow(index);
                }
            }
        }else{
            if(gender) {
                //10
                if (state.m0.length() != 0) {
                    let index = randomness::u64_range(0, state.m0.length());
                    matched = *state.m0.borrow(index);
                }
            }
            else{ //00
                if(state.f0.length()!=0){
                    let index = randomness::u64_range(0, state.f0.length());
                    matched = *state.f0.borrow(index);
                }
            }

        };
        let match_found = if(matched != @0x0){true}else{false};
        event::emit(MatchedEvent {
            match_found,
            profileA: profile,
            profileB: matched,
            timestamp: timestamp::now_seconds()
        });
    }

    //==============================================================================================
    // Helper functions
    //==============================================================================================

    //==============================================================================================
    // View functions
    //==============================================================================================

    #[view]
    public fun get_collection_address(): address acquires State {
        let state = borrow_global_mut<State>(@admin);
        collection::create_collection_address(
            &signer::address_of(&account::create_signer_with_capability(&state.signer_cap)),
            &string::utf8(COLLECTION_NAME)
        )
    }

    #[view]
    public fun check_profile_exists(user: address): bool acquires State{
        let state = borrow_global_mut<State>(@admin);
        state.users.contains(&user)
    }

    //==============================================================================================
    // Validation functions
    //==============================================================================================

    inline fun assert_admin(admin: address) {
        assert!(admin == @admin, ERROR_SIGNER_NOT_ADMIN);
    }

    //==============================================================================================
    // Test functions
    //==============================================================================================
    #[test(admin = @admin)]
    fun test_init_module_success(
        admin: &signer
    ) acquires State {
        let admin_address = signer::address_of(admin);
        account::create_account_for_test(admin_address);

        let aptos_framework = account::create_account_for_test(@aptos_framework);
        timestamp::set_time_has_started_for_testing(&aptos_framework);

        init_module(admin);

        let expected_resource_account_address = account::create_resource_address(&admin_address, SEED);
        assert!(account::exists_at(expected_resource_account_address), 0);

        let state = borrow_global<State>(admin_address);
        assert!(
            account::get_signer_capability_address(&state.signer_cap) == expected_resource_account_address,
            0
        );

        let expected_collection_address = collection::create_collection_address(
            &expected_resource_account_address,
            &string::utf8(COLLECTION_NAME)
        );
        let collection_object = object::address_to_object<collection::Collection>(expected_collection_address);
        assert!(
            collection::creator<collection::Collection>(collection_object) == expected_resource_account_address,
            4
        );
        assert!(
            collection::name<collection::Collection>(collection_object) == string::utf8(COLLECTION_NAME),
            4
        );
        assert!(
            collection::description<collection::Collection>(collection_object) == string::utf8(COLLECTION_DESCRIPTION),
            4
        );
        assert!(
            collection::uri<collection::Collection>(collection_object) == string::utf8(COLLECTION_URI),
            4
        );

        assert!(state.profile_minted_events == 0, 2);
    }

    #[test(admin = @admin, user = @0xA)]
    fun test_mint_success(
        admin: &signer,
        user: &signer,
    ) acquires State {
        let admin_address = signer::address_of(admin);
        let user_address = signer::address_of(user);
        account::create_account_for_test(admin_address);
        account::create_account_for_test(user_address);

        let aptos_framework = account::create_account_for_test(@aptos_framework);
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        init_module(admin);


        let resource_account_address = account::create_resource_address(&@admin, SEED);

        let name = string::utf8(b"Bob");
        let age: u8 = 20;
        let gender = true; //1 for men
        let seeking: u8 = 0;//0=women,1=men,2=both
        let description = string::utf8(b"dev"); //limit to 100 words
        let tg = string::utf8(b"bobtg");
        let photo = string::utf8(b"test_photo_url");
        mint_profile(user,name,age,gender,seeking,description,tg,photo);

        let state = borrow_global<State>(admin_address);

        let expected_nft_token_address = token::create_token_address(
            &resource_account_address,
            &string::utf8(COLLECTION_NAME),
            &string_utils::format1(&b"#0:{}", name)
        );
        let nft_token_object = object::address_to_object<Profile>(expected_nft_token_address);
        assert!(
            object::is_owner(nft_token_object, user_address) == true,
            2
        );
        assert!(
            token::creator(nft_token_object) == resource_account_address,
            3
        );
        assert!(
            token::name(nft_token_object) == string_utils::format2(&b"#{}:{}", state.users.length()-1, name),
            3
        );
        assert!(
            token::uri(nft_token_object) == photo,
            3
        );
        assert!(state.profile_minted_events == 1, 3);

    }

}
