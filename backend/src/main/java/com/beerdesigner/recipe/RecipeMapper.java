//------------------------------------------------
//
// Jose Antonio Quero, @ 10 July 2026
// Latest Revision: 10 July 2026
//
//------------------------------------------------

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
        recipe.getBrewer(),
        recipe.getUntappdUrl(),
        recipe.getEquipmentProfileId(),
        recipe.getMashProfileId(),
        recipe.getCarbonationProfileId(),
        recipe.getFermentationProfileId(),
        recipe.getGlasswareId(),
        recipe.getStyleId(),
        recipe.getBatchVolumeL(),
        recipe.getEfficiencyPercent(),
        recipe.getYeastId(),
        recipe.getWaterProfileId(),
        recipe.getNotes(),
        recipe.getVersion(),
        recipe.getUpdatedAt(),
        toImage(recipe)
    );
  }

  public RecipeDetailDto toDetail(Recipe recipe) {
    return new RecipeDetailDto(
        recipe.getId(),
        recipe.getName(),
        recipe.getBrewer(),
        recipe.getUntappdUrl(),
        recipe.getEquipmentProfileId(),
        recipe.getMashProfileId(),
        recipe.getCarbonationProfileId(),
        recipe.getFermentationProfileId(),
        recipe.getGlasswareId(),
        recipe.getStyleId(),
        recipe.getBatchVolumeL(),
        recipe.getEfficiencyPercent(),
        recipe.getBoilVolumeL(),
        recipe.getYeastId(),
        recipe.getWaterProfileId(),
        recipe.getMalts().stream()
            .sorted(Comparator.comparing(RecipeMalt::getPosition))
            .map(item -> new RecipeMaltDto(item.getMaltId(), item.getAmountKg(), item.getNotes()))
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
        recipe.getProcessAdditions().stream()
            .sorted(Comparator.comparing(RecipeProcessAddition::getPosition))
            .map(item -> new RecipeDtos.RecipeProcessAdditionDto(item.getName(), item.getBrand(), item.getAmountG(), item.getStage(), item.getTimeMin(), item.getTemperatureC(), item.getDayLabel(), item.getNotes()))
            .toList(),
        new RecipeDtos.WaterTreatmentDto(recipe.getWaterCalcium(), recipe.getWaterMagnesium(), recipe.getWaterSodium(), recipe.getWaterSulfate(), recipe.getWaterChloride(), recipe.getWaterBicarbonate(), recipe.getMashTargetPh(), recipe.getSpargeTargetPh(), recipe.getWaterNotes()),
        new FermentationDto(recipe.getPrimaryDays(), recipe.getPrimaryTempC(), recipe.getSecondaryDays(), recipe.getSecondaryTempC()),
        new DryHopDto(recipe.getDryHopEnabled(), recipe.getDryHopDays(), recipe.getDryHopTempC()),
        new PackagingDto(recipe.getMaturationDays(), recipe.getCarbonationVolumes(), recipe.getPackagingMethod()),
        recipe.getNotes(),
        recipe.getVersion(),
        recipe.getUpdatedAt(),
        toImage(recipe)
    );
  }

  private RecipeDtos.RecipeImageDto toImage(Recipe recipe) {
    if (recipe.getImageStoredName() == null) return null;
    return new RecipeDtos.RecipeImageDto(
        "/api/recipes/" + recipe.getId() + "/image",
        recipe.getImageOriginalName(), recipe.getImageContentType(), recipe.getImageSizeBytes(),
        recipe.getImageWidth(), recipe.getImageHeight(), recipe.getImageUploadedAt()
    );
  }
}
