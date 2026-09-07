package com.foodrush.service;

import com.foodrush.common.Role;
import com.foodrush.entity.*;
import com.foodrush.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Optional development seeder. Enable with SEED_DATA=true (or app.seed.enabled=true).
 * Disabled by default so the production backend ships empty.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
public class SeedData implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final DeliveryRiderRepository riderRepository;
    private final CouponRepository couponRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        String hash = passwordEncoder.encode("Password123!");

        userRepository.save(User.builder().name("System Admin")
                .email("admin@foodrush.ng").passwordHash(hash).role(Role.ADMIN).build());
        User owner = userRepository.save(User.builder().name("Naija Kitchen Owner")
                .email("owner@foodrush.ng").passwordHash(hash).role(Role.RESTAURANT).build());
        User rider = userRepository.save(User.builder().name("Emeka Okafor")
                .email("rider@foodrush.ng").passwordHash(hash).role(Role.RIDER).build());
        userRepository.save(User.builder().name("Alice Customer")
                .email("customer@foodrush.ng").passwordHash(hash).role(Role.CUSTOMER).build());
        riderRepository.save(DeliveryRider.builder().userId(rider.getId()).build());

        Restaurant r1 = restaurantRepository.save(Restaurant.builder()
                .ownerId(owner.getId()).name("Naija Kitchen").cuisine("Nigerian")
                .description("Authentic Nigerian dishes.").address("12 Admiralty Way").city("Lagos").build());
        Restaurant r2 = restaurantRepository.save(Restaurant.builder()
                .ownerId(owner.getId()).name("Suya Central").cuisine("Grills")
                .description("Suya and grilled delights.").address("5 Ikeja Road").city("Lagos").build());

        add(r1, "Jollof Rice & Chicken", "Rice", 2500, List.of(
                new Opt("Extra Chicken", 1500), new Opt("Plantain", 500)));
        add(r1, "Egusi Soup & Pounded Yam", "Swallow", 2200, List.of(new Opt("Extra Meat", 800)));
        add(r2, "Beef Suya", "Grills", 3000, List.of(new Opt("Extra Spice", 200)));
        add(r2, "Grilled Croaker Fish", "Grills", 4500, List.of());

        couponRepository.save(Coupon.builder().code("WELCOME10").discountType("percentage").discountValue(10).build());
        couponRepository.save(Coupon.builder().code("JUMBO500").discountType("fixed").discountValue(500).build());

        log.info("Development seed data loaded for admin, owner, rider, and customer accounts");
    }

    private record Opt(String name, double price) {}

    private void add(Restaurant r, String name, String category, double price, List<Opt> opts) {
        MenuItem item = MenuItem.builder().restaurant(r).name(name).category(category).price(price).build();
        for (Opt o : opts) {
            item.getOptions().add(FoodItemOption.builder().menuItem(item).name(o.name()).price(o.price()).build());
        }
        menuItemRepository.save(item);
    }
}
