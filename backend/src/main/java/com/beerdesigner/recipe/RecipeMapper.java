package com.beerdesigner.recipe;

import com.beerdesigner.recipe.RecipeDtos.DryHopDto;
import com.beerdesigner.recipe.RecipeDtos.FermentationDto;
import com.beerdesigner.recipe.RecipeDtos.PackagingDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeBoilStepDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeDetailDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeHopDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeMashStepDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeMaltDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeSummaryDto;
import com.beerdesigner.recipe.RecipeDtos.RecipeWaterAdditionDto;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RecipeMapper {
  public RecipeSummaryDto toSummary(Recipe recipe) {
    return new RecipeSummaryDto(
        recipe.getId(),
        recipe.getName(),
        recipe.getStyleId(),
        recipe.getBatchVolumeL(),
        recipe.getEfficiencyPercent(),
        recipe.getYeastId(),
        recipe.getWaterProfileId(),
        recipe.getNotes()
    );
  }

  public RecipeDetailDto toDetail(Recipe recipe) {
    return new RecipeDetailDto(
        recipe.getId(),
        recipe.getName(),
        recipe.getStyleId(),
        recipe.getBatchVolumeL(),
        recipe.getEfficiencyPercent(),
        recipe.getBoilVolumeL(),
        recipe.getYeastId(),
        recipe.getWaterProfileId(),
        recipe.getMalts().stream()
            .sorted(Comparator.comparing(RecipeMalt::getPosition))
            .map(item -> new RecipeMaltDto(item.getMaltId(), item.getAmountKg()))
            .toList(),
        recipe.getHops().stream()
            .sorted(Comparator.comparing(RecipeHop::getPosition))
            .map(item -> new RecipeHopDto(item.getHopId(), item.getAmountG(), item.getAlphaAcids(), item.getTimeMin(), item.getUse()))
            .toList(),
        recipe.getWaterAdditions().stream()
            .sorted(Comparator.comparing(RecipeWaterAddition::getPosition))
            .map(item -> new RecipeWaterAdditionDto(item.getName(), item.getAmountG()))
            .toList(),
        recipe.getMashSteps().stream()
            .sorted(Comparator.comparing(RecipeMashStep::getPosition))
            .map(item -> new RecipeMashStepDto(item.getName(), item.getTemperatureC(), item.getTimeMin()))
            .toList(),
        recipe.getBoilSteps().stream()
            .sorted(Comparator.comparing(RecipeBoilStep::getPosition))
            .map(item -> new RecipeBoilStepDto(item.getName(), item.getTimeMin(), item.getDescription()))
            .toList(),
        new FermentationDto(recipe.getPrimaryDays(), recipe.getPrimaryTempC(), recipe.getSecondaryDays(), recipe.getSecondaryTempC()),
        new DryHopDto(recipe.getDryHopEnabled(), recipe.getDryHopDays(), recipe.getDryHopTempC()),
        new PackagingDto(recipe.getMaturationDays(), recipe.getCarbonationVolumes(), recipe.getPackagingMethod()),
        recipe.getNotes()
    );
  }
}
